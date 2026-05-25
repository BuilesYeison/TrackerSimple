import { getDB } from "$lib/infrastructure/db/sqlite";

export async function importBackupFromFile(file: File): Promise<void> {
	const text = await file.text();

	let backup: unknown;
	try {
		backup = JSON.parse(text);
	} catch {
		throw new Error("El archivo no es un JSON válido.");
	}

	if (!backup || typeof backup !== "object") {
		throw new Error("Formato de backup inválido.");
	}

	const data = backup as Record<string, unknown>;

	if (!data.version || typeof data.version !== "string") {
		throw new Error("Formato de backup inválido. Falta 'version' o no es un string.");
	}
	if (!Array.isArray(data.accounts)) {
		throw new Error("Formato de backup inválido. 'accounts' debe ser un array.");
	}
	if (!Array.isArray(data.categories)) {
		throw new Error("Formato de backup inválido. 'categories' debe ser un array.");
	}
	if (!data.records || typeof data.records !== "object") {
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

	const db = getDB();

	await db.execute("BEGIN TRANSACTION");

	try {
		await db.execute("DELETE FROM accounts");
		await db.execute("DELETE FROM categories");
		await db.execute("DELETE FROM records");

		for (const a of accounts) {
			const acc = a as Record<string, unknown>;
			await db.run(
				`INSERT INTO accounts (id, name, type, currency, balance, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[acc.id, acc.name, acc.type, acc.currency ?? "COP", acc.balance ?? 0, (acc as any).isActive ? 1 : 0, acc.createdAt ?? new Date().toISOString(), acc.updatedAt ?? new Date().toISOString()],
			);
		}

		for (const c of categories) {
			const cat = c as Record<string, unknown>;
			await db.run(
				`INSERT INTO categories (id, name, type, isDefault, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
				[cat.id, cat.name, cat.type, (cat as any).isDefault ? 1 : 0, cat.createdAt ?? new Date().toISOString(), cat.updatedAt ?? new Date().toISOString()],
			);
		}

		for (const [_month, recs] of Object.entries(records)) {
			for (const r of recs) {
				const rec = r as Record<string, unknown>;
				await db.run(
					`INSERT INTO records (id, type, amount, accountId, toAccountId, categoryId, note, tag, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[rec.id, rec.type, rec.amount, rec.accountId, rec.toAccountId ?? null, rec.categoryId, rec.note ?? null, rec.tag ?? null, rec.date instanceof Date ? (rec.date as Date).toISOString() : String(rec.date), rec.createdAt instanceof Date ? (rec.createdAt as Date).toISOString() : String(rec.createdAt), rec.updatedAt instanceof Date ? (rec.updatedAt as Date).toISOString() : String(rec.updatedAt)],
				);
			}
		}

		if (settings) {
			await db.run(
				`INSERT OR REPLACE INTO settings (key, currency, onboardingCompleted, lastBackupAt) VALUES (?, ?, ?, ?)`,
				[settings.key, settings.currency, (settings as any).onboardingCompleted ? 1 : 0, settings.lastBackupAt ?? null],
			);
		}

		await db.execute("COMMIT");
	} catch (err) {
		await db.execute("ROLLBACK");
		throw err;
	}
}
