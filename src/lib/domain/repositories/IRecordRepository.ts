import type { Record } from '../entities';
import type { AccountBalance, MonthlyAggregate, CategoryTotal } from '../entities';
import type { RecordType } from '../entities';

export interface IRecordRepository {
	create(record: Record): Promise<void>;
	update(record: Record): Promise<void>;
	findById(id: string): Promise<Record | null>;
	findByAccount(accountId: string): Promise<Record[]>;
	findByCategory(categoryId: string): Promise<Record[]>;
	findByDateRange(from: Date, to: Date): Promise<Record[]>;
	findAll(): Promise<Record[]>;
	delete(id: string): Promise<void>;
	getBalancesForActiveAccounts(): Promise<AccountBalance[]>;
	getMonthlyAggregation(from: Date, to: Date): Promise<MonthlyAggregate[]>;
	getCategoryTotals(from: Date, to: Date, type: RecordType): Promise<CategoryTotal[]>;
}
