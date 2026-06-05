import { getDB } from '$lib/infrastructure/db/sqlite';
import type { capSQLiteSet } from '@capacitor-community/sqlite/dist/esm/definitions';

const SQL_INSERT_ACCOUNT =
	'INSERT INTO accounts (id, name, type, currency, balance, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
const SQL_INSERT_CATEGORY =
	'INSERT INTO categories (id, name, type, isDefault, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)';
const SQL_INSERT_RECORD =
	'INSERT INTO records (id, type, amount, accountId, toAccountId, categoryId, note, tag, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
const SQL_UPSERT_SETTINGS =
	'INSERT OR REPLACE INTO settings (key, currency, onboardingCompleted, lastBackupAt, syncFileName) VALUES (?, ?, ?, ?, ?)';

export async function importBackupFromFile(file: File): Promise<void> {
	const text = await file.text();

	let backup: unknown;
	try {
		backup = JSON.parse(text);
	} catch {
		throw new Error('El archivo no es un JSON válido.');
	}

	if (!backup || typeof backup !== 'object') {
		throw new Error('Formato de backup inválido.');
	}

	const data = backup as Record<string, unknown>;

	if (!data.version || typeof data.version !== 'string') {
		throw new Error("Formato de backup inválido. Falta 'version' o no es un string.");
	}
	if (!Array.isArray(data.accounts)) {
		throw new Error("Formato de backup inválido. 'accounts' debe ser un array.");
	}
	if (!Array.isArray(data.categories)) {
		throw new Error("Formato de backup inválido. 'categories' debe ser un array.");
	}
	if (!data.records || typeof data.records !== 'object') {
		throw new Error("Formato de backup inválido. 'records' debe ser un objeto.");
	}

	const accounts = data.accounts as unknown[];
	const categories = data.categories as unknown[];
	const records = data.records as Record<string, unknown[]>;
	const settings = data.settings as Record<string, unknown> | undefined;

	for (const a of accounts) {
		const acc = a as Record<string, unknown>;
		if (!acc.id || !acc.name || !acc.type) {
			throw new Error("Una cuenta en el backup no tiene 'id', 'name' o 'type'.");
		}
	}
	for (const c of categories) {
		const cat = c as Record<string, unknown>;
		if (!cat.id || !cat.name || !cat.type) {
			throw new Error("Una categoría en el backup no tiene 'id', 'name' o 'type'.");
		}
	}
	for (const [_month, recs] of Object.entries(records)) {
		for (const r of recs) {
			const rec = r as Record<string, unknown>;
			const missing: string[] = [];
			if (rec.id == null) missing.push('id');
			if (rec.type == null) missing.push('type');
			if (rec.amount == null) missing.push('amount');
			if (rec.accountId == null) missing.push('accountId');
			if (rec.categoryId == null) missing.push('categoryId');
			if (rec.date == null) missing.push('date');
			if (missing.length > 0) {
				throw new Error(
					`Registro (mes ${_month}): falta(n) campo(s): ${missing.join(', ')}.` +
						` id=${String(rec.id)}, type=${String(rec.type)}, amount=${String(rec.amount)}, ` +
						`accountId=${String(rec.accountId)}, categoryId=${String(rec.categoryId)}, date=${String(rec.date)}`,
				);
			}
		}
	}

	const db = getDB();
	const statements: capSQLiteSet[] = [];

	statements.push({ statement: 'DELETE FROM records', values: [] });
	statements.push({ statement: 'DELETE FROM accounts', values: [] });
	statements.push({ statement: 'DELETE FROM categories', values: [] });

	for (const a of accounts) {
		const acc = a as Record<string, unknown>;
		statements.push({
			statement: SQL_INSERT_ACCOUNT,
			values: [
				acc.id,
				acc.name,
				acc.type,
				acc.currency ?? 'COP',
				acc.balance ?? 0,
				(acc as any).isActive ? 1 : 0,
				acc.createdAt ?? new Date().toISOString(),
				acc.updatedAt ?? new Date().toISOString(),
			],
		});
	}

	for (const c of categories) {
		const cat = c as Record<string, unknown>;
		statements.push({
			statement: SQL_INSERT_CATEGORY,
			values: [
				cat.id,
				cat.name,
				cat.type,
				(cat as any).isDefault ? 1 : 0,
				cat.createdAt ?? new Date().toISOString(),
				cat.updatedAt ?? new Date().toISOString(),
			],
		});
	}

	for (const [_month, recs] of Object.entries(records)) {
		for (const r of recs) {
			const rec = r as Record<string, unknown>;
			statements.push({
				statement: SQL_INSERT_RECORD,
				values: [
					rec.id,
					rec.type,
					rec.amount,
					rec.accountId,
					rec.toAccountId ?? null,
					rec.categoryId,
					rec.note ?? null,
					rec.tag ?? null,
					String(rec.date),
					String(rec.createdAt),
					String(rec.updatedAt),
				],
			});
		}
	}

	if (settings) {
		statements.push({
			statement: SQL_UPSERT_SETTINGS,
			values: [
				settings.key,
				settings.currency,
				(settings as any).onboardingCompleted ? 1 : 0,
				settings.lastBackupAt ?? null,
				(settings as any).syncFileName ?? null,
			],
		});
	}

	await db.executeSet(statements);
}
