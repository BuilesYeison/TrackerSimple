import type { Record } from '../../domain/entities';
import type { IRecordRepository } from '../../domain/repositories';
import type { AppDatabase } from '../db';

export class DexieRecordRepository implements IRecordRepository {
	constructor(private db: AppDatabase) {}

	async create(record: Record): Promise<void> {
		await this.db.records.add(record);
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
		return this.db.records
			.where('date')
			.between(from, to)
			.toArray();
	}

	async findAll(): Promise<Record[]> {
		return this.db.records.toArray();
	}

	async delete(id: string): Promise<void> {
		await this.db.records.delete(id);
	}
}
