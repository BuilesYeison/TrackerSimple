import type { Record } from '../entities';

export interface IRecordRepository {
	create(record: Record): Promise<void>;
	findById(id: string): Promise<Record | null>;
	findByAccount(accountId: string): Promise<Record[]>;
	findByCategory(categoryId: string): Promise<Record[]>;
	findByDateRange(from: Date, to: Date): Promise<Record[]>;
	findAll(): Promise<Record[]>;
	delete(id: string): Promise<void>;
}
