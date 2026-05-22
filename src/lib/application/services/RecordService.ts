import {
	createRecord,
	type Record,
	type RecordType
} from '../../domain/entities';
import type { IRecordRepository } from '../../domain/repositories';

export class RecordService {
	constructor(private repo: IRecordRepository) {}

	async register(params: {
		type: RecordType;
		amount: number;
		accountId: string;
		toAccountId?: string | null;
		categoryId: string;
		note?: string | null;
		tag?: string | null;
		date?: Date | null;
	}): Promise<Record> {
		const record = createRecord(params);
		await this.repo.create(record);
		return record;
	}

	async update(record: Record): Promise<void> {
		record.updatedAt = new Date();
		await this.repo.update({ ...record });
	}

	async getByAccount(accountId: string): Promise<Record[]> {
		return this.repo.findByAccount(accountId);
	}

	async getByDateRange(from: Date, to: Date): Promise<Record[]> {
		return this.repo.findByDateRange(from, to);
	}

	async getRecent(limit = 5): Promise<Record[]> {
		const all = await this.repo.findAll();
		return all
			.filter((r) => r.date instanceof Date || r.createdAt instanceof Date)
			.sort((a, b) => {
				const ad = a.date instanceof Date ? a.date : a.createdAt;
				const bd = b.date instanceof Date ? b.date : b.createdAt;
				return bd.getTime() - ad.getTime();
			})
			.slice(0, limit);
	}

	async getAll(): Promise<Record[]> {
		return this.repo.findAll();
	}

	async delete(id: string): Promise<void> {
		await this.repo.delete(id);
	}

	async getById(id: string): Promise<Record | null> {
		return this.repo.findById(id);
	}
}
