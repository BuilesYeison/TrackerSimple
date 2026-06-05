import { describe, it, expect, vi } from 'vitest';
import { RecordService } from '../RecordService';
import type { IRecordRepository } from '$lib/domain/repositories';
import type { Record } from '$lib/domain/entities';

function makeRecord(overrides: Partial<Record> = {}): Record {
	const now = new Date();
	return {
		id: 'rec-1',
		type: 'expense',
		amount: 10000,
		accountId: 'acc-1',
		toAccountId: null,
		categoryId: 'cat-1',
		note: null,
		tag: null,
		date: new Date('2025-06-01'),
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

function mockRepo(overrides: Partial<IRecordRepository> = {}): IRecordRepository {
	return {
		create: vi.fn().mockResolvedValue(undefined),
		update: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
		findById: vi.fn().mockResolvedValue(null),
		findAll: vi.fn().mockResolvedValue([]),
		findByAccount: vi.fn().mockResolvedValue([]),
		findByCategory: vi.fn().mockResolvedValue([]),
		findByDateRange: vi.fn().mockResolvedValue([]),
		getBalancesForActiveAccounts: vi.fn().mockResolvedValue([]),
		getMonthlyAggregation: vi.fn().mockResolvedValue([]),
		getCategoryTotals: vi.fn().mockResolvedValue([]),
		...overrides,
	} as unknown as IRecordRepository;
}

describe('RecordService', () => {
	describe('register', () => {
		it('creates an expense record and persists it', async () => {
			const create = vi.fn().mockResolvedValue(undefined);
			const repo = mockRepo({ create });
			const svc = new RecordService(repo);

			const rec = await svc.register({
				type: 'expense',
				amount: 25000,
				accountId: 'acc-1',
				categoryId: 'cat-1',
			});

			expect(rec.type).toBe('expense');
			expect(rec.amount).toBe(25000);
			expect(rec.accountId).toBe('acc-1');
			expect(rec.toAccountId).toBeNull();
			expect(create).toHaveBeenCalledTimes(1);
		});

		it('creates a transfer record with toAccountId', async () => {
			const repo = mockRepo();
			const svc = new RecordService(repo);

			const rec = await svc.register({
				type: 'transfer',
				amount: 100000,
				accountId: 'acc-1',
				toAccountId: 'acc-2',
				categoryId: 'cat-t',
			});

			expect(rec.type).toBe('transfer');
			expect(rec.toAccountId).toBe('acc-2');
		});

		it('creates an income record', async () => {
			const repo = mockRepo();
			const svc = new RecordService(repo);

			const rec = await svc.register({
				type: 'income',
				amount: 500000,
				accountId: 'acc-1',
				categoryId: 'cat-salario',
			});

			expect(rec.type).toBe('income');
		});

		it('preserves note and tag', async () => {
			const repo = mockRepo();
			const svc = new RecordService(repo);

			const rec = await svc.register({
				type: 'expense',
				amount: 15000,
				accountId: 'acc-1',
				categoryId: 'cat-1',
				note: 'Almuerzo',
				tag: 'trabajo',
			});

			expect(rec.note).toBe('Almuerzo');
			expect(rec.tag).toBe('trabajo');
		});

		it('uses provided date', async () => {
			const repo = mockRepo();
			const svc = new RecordService(repo);
			const customDate = new Date('2025-03-15');

			const rec = await svc.register({
				type: 'expense',
				amount: 5000,
				accountId: 'acc-1',
				categoryId: 'cat-1',
				date: customDate,
			});

			expect(rec.date).toBe(customDate);
		});

		it('generates unique IDs for each record', async () => {
			const repo = mockRepo();
			const svc = new RecordService(repo);

			const a = await svc.register({ type: 'expense', amount: 100, accountId: 'a', categoryId: 'c' });
			const b = await svc.register({ type: 'expense', amount: 100, accountId: 'a', categoryId: 'c' });

			expect(a.id).not.toBe(b.id);
		});
	});

	describe('update', () => {
		it('updates updatedAt and calls repo.update', async () => {
			const update = vi.fn().mockResolvedValue(undefined);
			const repo = mockRepo({ update });
			const svc = new RecordService(repo);

			const rec = makeRecord();
			const originalUpdatedAt = rec.updatedAt;
			await svc.update(rec);

			expect(rec.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
			expect(update).toHaveBeenCalledTimes(1);
		});
	});

	describe('getRecent', () => {
		it('returns most recent records sorted by date desc', async () => {
			const records = [
				makeRecord({ id: 'r1', date: new Date('2025-01-01') }),
				makeRecord({ id: 'r2', date: new Date('2025-06-01') }),
				makeRecord({ id: 'r3', date: new Date('2025-03-15') }),
			];
			const repo = mockRepo({ findAll: vi.fn().mockResolvedValue(records) });
			const svc = new RecordService(repo);

			const recent = await svc.getRecent(3);
			expect(recent).toHaveLength(3);
			expect(recent[0].id).toBe('r2'); // June
			expect(recent[1].id).toBe('r3'); // March
			expect(recent[2].id).toBe('r1'); // Jan
		});

		it('limits results to requested count', async () => {
			const records = [
				makeRecord({ id: 'r1', date: new Date('2025-06-01') }),
				makeRecord({ id: 'r2', date: new Date('2025-05-01') }),
				makeRecord({ id: 'r3', date: new Date('2025-04-01') }),
			];
			const repo = mockRepo({ findAll: vi.fn().mockResolvedValue(records) });
			const svc = new RecordService(repo);

			const recent = await svc.getRecent(2);
			expect(recent).toHaveLength(2);
		});

		it('defaults limit to 5', async () => {
			const records = Array.from({ length: 10 }, (_, i) =>
				makeRecord({ id: `r${i}`, date: new Date(2025, 0, i + 1) }),
			);
			const repo = mockRepo({ findAll: vi.fn().mockResolvedValue(records) });
			const svc = new RecordService(repo);

			const recent = await svc.getRecent();
			expect(recent).toHaveLength(5);
		});

		it('sorts by createdAt when date is not a Date instance', async () => {
			const r1 = makeRecord({ id: 'r1', date: new Date('2025-01-01'), createdAt: new Date('2025-01-01') });
			(r1 as any).date = '2025-01-01T00:00:00.000Z'; // not a Date instance, falls back to createdAt (Jan)
			const r2 = makeRecord({ id: 'r2', date: new Date('2025-06-01') }); // date is Date (June)
			const repo = mockRepo({ findAll: vi.fn().mockResolvedValue([r1, r2]) });
			const svc = new RecordService(repo);

			const recent = await svc.getRecent(2);
			expect(recent[0].id).toBe('r2');
			expect(recent[1].id).toBe('r1');
		});
	});

	describe('delete', () => {
		it('delegates to repo.delete', async () => {
			const deleteFn = vi.fn().mockResolvedValue(undefined);
			const repo = mockRepo({ delete: deleteFn });
			const svc = new RecordService(repo);

			await svc.delete('rec-1');
			expect(deleteFn).toHaveBeenCalledWith('rec-1');
		});
	});
});
