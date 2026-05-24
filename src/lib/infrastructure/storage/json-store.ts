import { readJSON, writeJSON, listDir, deleteFile } from './filesystem';
import type { Account, Category, Record } from '../../domain/entities';
import type { AppSettings } from '../../domain/entities/AppSettings';

function sanitize<T>(data: T): T {
	return JSON.parse(JSON.stringify(data));
}

function extractDate(r: Record): Date {
	if (r.date instanceof Date) return r.date;
	if (typeof r.date === 'string') return new Date(r.date);
	if (r.createdAt instanceof Date) return r.createdAt;
	if (typeof r.createdAt === 'string') return new Date(r.createdAt);
	return new Date();
}

export class JsonFileStore {
	async loadAccounts(): Promise<Account[]> {
		return (await readJSON<Account[]>('accounts.json')) ?? [];
	}

	async saveAccounts(data: Account[]): Promise<void> {
		await writeJSON('accounts.json', sanitize(data));
	}

	async loadCategories(): Promise<Category[]> {
		return (await readJSON<Category[]>('categories.json')) ?? [];
	}

	async saveCategories(data: Category[]): Promise<void> {
		await writeJSON('categories.json', sanitize(data));
	}

	async loadSettings(): Promise<AppSettings | null> {
		return readJSON<AppSettings>('settings.json');
	}

	async saveSettings(data: AppSettings): Promise<void> {
		await writeJSON('settings.json', sanitize(data));
	}

	async loadAllRecords(): Promise<Record[]> {
		const months = await listDir('records');
		const records: Record[] = [];
		for (const name of months) {
			const monthRecords = await readJSON<Record[]>(`records/${name}`);
			if (monthRecords) records.push(...monthRecords);
		}
		return records;
	}

	async saveAllRecords(records: Record[]): Promise<void> {
		const safe = sanitize(records);
		const recordsByMonth = new Map<string, Record[]>();
		for (const r of safe) {
			const d = extractDate(r);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			if (!recordsByMonth.has(key)) recordsByMonth.set(key, []);
			recordsByMonth.get(key)!.push(r);
		}

		const existingMonths = await listDir('records');
		for (const name of existingMonths) {
			if (!recordsByMonth.has(name.replace('.json', ''))) {
				await deleteFile(`records/${name}`);
			}
		}

		for (const [month, recs] of recordsByMonth) {
			await writeJSON(`records/${month}.json`, recs);
		}
	}
}
