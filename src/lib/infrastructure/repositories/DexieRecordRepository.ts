import type { Record } from '../../domain/entities';
import type { IRecordRepository } from '../../domain/repositories';
import type { AppDatabase } from '../db';
import type { JsonFileStore } from '../storage/json-store';

export class DexieRecordRepository implements IRecordRepository {
	constructor(
		private db: AppDatabase,
		private jsonStore: JsonFileStore,
	) {}

	async create(record: Record): Promise<void> {
		await this.db.records.add(record);
		await this.syncToFile();
	}

	async update(record: Record): Promise<void> {
		await this.db.records.put(record);
		await this.syncToFile();
	}

	async findById(id: string): Promise<Record | null> {
		return (await this.db.records.get(id)) ?? null;
	}

	async findByAccount(accountId: string): Promise<Record[]> {
		return this.db.records
			.where('accountId')
			.equals(accountId)
			.or('toAccountId')
			.equals(accountId)
			.toArray();
	}

	async findByCategory(categoryId: string): Promise<Record[]> {
		return this.db.records.where('categoryId').equals(categoryId).toArray();
	}

	async findByDateRange(from: Date, to: Date): Promise<Record[]> {
		return this.db.records.where('date').between(from, to).toArray();
	}

	async findAll(): Promise<Record[]> {
		return this.db.records.toArray();
	}

	async delete(id: string): Promise<void> {
		await this.db.records.delete(id);
		await this.syncToFile();
	}

	private async syncToFile(): Promise<void> {
		try {
			const all = await this.db.records.toArray();
			await this.jsonStore.saveAllRecords(all);
		} catch (err) {
			console.warn('syncToFile records failed:', err);
		}
	}
}
