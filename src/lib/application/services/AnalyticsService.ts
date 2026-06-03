import type { IRecordRepository } from '../../domain/repositories';
import type { MonthlyAggregate, CategoryTotal } from '../../domain/entities';
import type { RecordType } from '../../domain/entities';

export class AnalyticsService {
	constructor(private recordRepo: IRecordRepository) {}

	async getAccountBalances(): Promise<Map<string, number>> {
		const rows = await this.recordRepo.getBalancesForActiveAccounts();
		return new Map(rows.map((r) => [r.accountId, r.balance]));
	}

	async getMonthlyAggregation(
		from: Date,
		to: Date,
	): Promise<MonthlyAggregate[]> {
		return this.recordRepo.getMonthlyAggregation(from, to);
	}

	async getCategoryTotals(
		from: Date,
		to: Date,
		type: RecordType,
	): Promise<CategoryTotal[]> {
		return this.recordRepo.getCategoryTotals(from, to, type);
	}
}
