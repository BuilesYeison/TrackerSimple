import { readJSON, writeJSON, listDir, deleteFile } from './filesystem';
import type { Account, Category, Record } from '../../domain/entities';
import type { AppSettings } from '../../domain/entities/AppSettings';

export class JsonFileStore {
	async loadAccounts(): Promise<Account[]> {
		return (await readJSON<Account[]>('accounts.json')) ?? [];
	}

	async saveAccounts(data: Account[]): Promise<void> {
		await writeJSON('accounts.json', data);
	}

	async loadCategories(): Promise<Category[]> {
		return (await readJSON<Category[]>('categories.json')) ?? [];
	}

	async saveCategories(data: Category[]): Promise<void> {
		await writeJSON('categories.json', data);
	}

	async loadSettings(): Promise<AppSettings | null> {
		return readJSON<AppSettings>('settings.json');
	}

	async saveSettings(data: AppSettings): Promise<void> {
		await writeJSON('settings.json', data);
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
		const recordsByMonth = new Map<string, Record[]>();
		for (const r of records) {
			const d = r.date instanceof Date ? r.date : r.createdAt;
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
