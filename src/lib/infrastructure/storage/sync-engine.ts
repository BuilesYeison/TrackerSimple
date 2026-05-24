import { getDb } from '../db/database';
import { createWorkspace, deleteFile } from './filesystem';
import { JsonFileStore } from './json-store';

export async function syncFileToDexie(): Promise<void> {
	const db = getDb();
	const store = new JsonFileStore();

	await createWorkspace();

	let accounts = await store.loadAccounts();
	let categories = await store.loadCategories();
	const records = await store.loadAllRecords();
	const settings = await store.loadSettings();

	if (!Array.isArray(accounts)) {
		await deleteFile('accounts.json');
		accounts = [];
	}
	if (!Array.isArray(categories)) {
		await deleteFile('categories.json');
		categories = [];
	}

	await db.accounts.clear();
	await db.categories.clear();
	await db.records.clear();

	if (accounts.length > 0) await db.accounts.bulkAdd(accounts as any[]);
	if (categories.length > 0) await db.categories.bulkAdd(categories as any[]);
	if (records.length > 0) {
		for (const record of records) {
			if (typeof record.date === 'string') record.date = new Date(record.date);
			if (typeof record.createdAt === 'string') record.createdAt = new Date(record.createdAt);
			if (typeof record.updatedAt === 'string') record.updatedAt = new Date(record.updatedAt);
		}
		await db.records.bulkAdd(records as any[]);
	}
	if (settings) await db.settings.put(settings as any);
}
