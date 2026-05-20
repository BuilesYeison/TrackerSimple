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

	async getByAccount(accountId: string): Promise<Record[]> {
		return this.repo.findByAccount(accountId);
	}

	async getByDateRange(from: Date, to: Date): Promise<Record[]> {
		return this.repo.findByDateRange(from, to);
	}

	async getRecent(limit = 5): Promise<Record[]> {
		const all = await this.repo.findAll();
		return all.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
	}

	async getAll(): Promise<Record[]> {
		return this.repo.findAll();
	}

	async delete(id: string): Promise<void> {
		await this.repo.delete(id);
	}
}
