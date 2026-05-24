import { getDB } from "$lib/infrastructure/db/sqlite";

export async function importBackupFromFile(file: File): Promise<void> {
	const text = await file.text();
	const backup = JSON.parse(text);

	if (!backup.version || !backup.accounts || !backup.categories || !backup.records) {
		throw new Error("Formato de backup inválido. Faltan campos requeridos.");
	}

	const db = getDB();
	await db.execute("DELETE FROM accounts");
	await db.execute("DELETE FROM categories");
	await db.execute("DELETE FROM records");

	for (const a of backup.accounts) {
		await db.run(
			`INSERT INTO accounts (id, name, type, currency, balance, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[a.id, a.name, a.type, a.currency, a.balance ?? 0, a.isActive ? 1 : 0, a.createdAt ?? new Date().toISOString(), a.updatedAt ?? new Date().toISOString()],
		);
	}
	for (const c of backup.categories) {
		await db.run(
			`INSERT INTO categories (id, name, type, isDefault, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
			[c.id, c.name, c.type, c.isDefault ? 1 : 0, c.createdAt ?? new Date().toISOString(), c.updatedAt ?? new Date().toISOString()],
		);
	}
	for (const [_month, recs] of Object.entries(backup.records)) {
		for (const r of recs as any[]) {
			await db.run(
				`INSERT INTO records (id, type, amount, accountId, toAccountId, categoryId, note, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[r.id, r.type, r.amount, r.accountId, r.toAccountId ?? null, r.categoryId, r.note ?? null, r.date instanceof Date ? (r.date as Date).toISOString() : String(r.date), r.createdAt instanceof Date ? (r.createdAt as Date).toISOString() : String(r.createdAt), r.updatedAt instanceof Date ? (r.updatedAt as Date).toISOString() : String(r.updatedAt)],
			);
		}
	}
	if (backup.settings) {
		await db.run(
			`INSERT OR REPLACE INTO settings (key, currency, onboardingCompleted, lastBackupAt) VALUES (?, ?, ?, ?)`,
			[backup.settings.key, backup.settings.currency, backup.settings.onboardingCompleted ? 1 : 0, backup.settings.lastBackupAt ?? null],
		);
	}
}
