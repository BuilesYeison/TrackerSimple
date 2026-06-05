import { describe, it, expect, vi } from 'vitest';
import { AnalyticsService } from '../AnalyticsService';
import type { IRecordRepository } from '$lib/domain/repositories';

function mockRepo(overrides: Partial<IRecordRepository> = {}): IRecordRepository {
	return {
		getBalancesForActiveAccounts: vi.fn().mockResolvedValue([]),
		getMonthlyAggregation: vi.fn().mockResolvedValue([]),
		getCategoryTotals: vi.fn().mockResolvedValue([]),
		...overrides,
	} as unknown as IRecordRepository;
}

describe('AnalyticsService', () => {
	describe('getAccountBalances', () => {
		it('returns empty map when no accounts have records', async () => {
			const repo = mockRepo();
			const svc = new AnalyticsService(repo);
			const result = await svc.getAccountBalances();
			expect(result.size).toBe(0);
		});

		it('returns a map of accountId -> balance', async () => {
			const repo = mockRepo({
				getBalancesForActiveAccounts: vi.fn().mockResolvedValue([
					{ accountId: 'a1', balance: 5000 },
					{ accountId: 'a2', balance: -3000 },
				]),
			});
			const svc = new AnalyticsService(repo);
			const result = await svc.getAccountBalances();

			expect(result.size).toBe(2);
			expect(result.get('a1')).toBe(5000);
			expect(result.get('a2')).toBe(-3000);
		});

		it('calls repo.getBalancesForActiveAccounts exactly once', async () => {
			const getBalances = vi.fn().mockResolvedValue([]);
			const repo = mockRepo({ getBalancesForActiveAccounts: getBalances });
			const svc = new AnalyticsService(repo);
			await svc.getAccountBalances();
			expect(getBalances).toHaveBeenCalledTimes(1);
		});
	});

	describe('getMonthlyAggregation', () => {
		it('delegates to repo with correct date range', async () => {
			const getMonthly = vi.fn().mockResolvedValue([]);
			const repo = mockRepo({ getMonthlyAggregation: getMonthly });
			const svc = new AnalyticsService(repo);

			const from = new Date('2025-01-01');
			const to = new Date('2025-01-31');
			await svc.getMonthlyAggregation(from, to);

			expect(getMonthly).toHaveBeenCalledWith(from, to);
		});

		it('returns monthly data from repo', async () => {
			const data = [
				{ month: '2025-01', income: 100000, expense: 50000 },
				{ month: '2025-02', income: 200000, expense: 30000 },
			];
			const repo = mockRepo({ getMonthlyAggregation: vi.fn().mockResolvedValue(data) });
			const svc = new AnalyticsService(repo);
			const result = await svc.getMonthlyAggregation(new Date(), new Date());

			expect(result).toEqual(data);
			expect(result).toHaveLength(2);
		});
	});

	describe('getCategoryTotals', () => {
		it('delegates to repo with correct params', async () => {
			const getTotals = vi.fn().mockResolvedValue([]);
			const repo = mockRepo({ getCategoryTotals: getTotals });
			const svc = new AnalyticsService(repo);

			const from = new Date('2025-01-01');
			const to = new Date('2025-01-31');
			await svc.getCategoryTotals(from, to, 'expense');

			expect(getTotals).toHaveBeenCalledWith(from, to, 'expense');
		});

		it('returns category totals for income type', async () => {
			const data = [
				{ categoryId: 'c1', total: 500000 },
				{ categoryId: 'c2', total: 200000 },
			];
			const repo = mockRepo({ getCategoryTotals: vi.fn().mockResolvedValue(data) });
			const svc = new AnalyticsService(repo);
			const result = await svc.getCategoryTotals(new Date(), new Date(), 'income');

			expect(result).toEqual(data);
			expect(result[0].categoryId).toBe('c1');
			expect(result[0].total).toBe(500000);
		});
	});
});
