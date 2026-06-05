import { describe, it, expect, vi } from 'vitest';
import { AccountService } from '../AccountService';
import type { IAccountRepository } from '$lib/domain/repositories';
import type { Account } from '$lib/domain/entities';

function makeAccount(overrides: Partial<Account> = {}): Account {
	const now = new Date();
	return {
		id: 'acc-1',
		name: 'Efectivo',
		type: 'cash',
		currency: 'COP',
		balance: 1000,
		isActive: true,
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

function mockRepo(overrides: Partial<IAccountRepository> = {}): IAccountRepository {
	return {
		create: vi.fn().mockResolvedValue(undefined),
		update: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
		findById: vi.fn().mockResolvedValue(null),
		findAll: vi.fn().mockResolvedValue([]),
		findActive: vi.fn().mockResolvedValue([]),
		...overrides,
	} as unknown as IAccountRepository;
}

describe('AccountService', () => {
	describe('create', () => {
		it('creates an account and persists it', async () => {
			const create = vi.fn().mockResolvedValue(undefined);
			const repo = mockRepo({ create });
			const svc = new AccountService(repo);

			const acc = await svc.create({ name: 'Nómina', type: 'debit', currency: 'USD', balance: 5000 });

			expect(acc.name).toBe('Nómina');
			expect(acc.type).toBe('debit');
			expect(acc.currency).toBe('USD');
			expect(acc.balance).toBe(5000);
			expect(acc.isActive).toBe(true);
			expect(create).toHaveBeenCalledTimes(1);
		});

		it('defaults balance to 0', async () => {
			const repo = mockRepo();
			const svc = new AccountService(repo);

			const acc = await svc.create({ name: 'Ahorros', type: 'cash', currency: 'COP' });
			expect(acc.balance).toBe(0);
		});

		it('generates unique IDs', async () => {
			const repo = mockRepo();
			const svc = new AccountService(repo);

			const a = await svc.create({ name: 'A', type: 'cash', currency: 'COP' });
			const b = await svc.create({ name: 'B', type: 'cash', currency: 'COP' });

			expect(a.id).not.toBe(b.id);
		});
	});

	describe('update', () => {
		it('delegates to repo.update', async () => {
			const update = vi.fn().mockResolvedValue(undefined);
			const repo = mockRepo({ update });
			const svc = new AccountService(repo);

			const acc = makeAccount({ name: 'Actualizado' });
			await svc.update(acc);

			expect(update).toHaveBeenCalledWith(acc);
		});
	});

	describe('deactivate', () => {
		it('sets isActive to false and updates timestamp', async () => {
			const acc = makeAccount({ isActive: true });
			const update = vi.fn().mockResolvedValue(undefined);
			const repo = mockRepo({
				findById: vi.fn().mockResolvedValue(acc),
				update,
			});
			const svc = new AccountService(repo);

			const before = Date.now();
			await svc.deactivate('acc-1');
			const after = Date.now();

			expect(acc.isActive).toBe(false);
			expect(acc.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
			expect(acc.updatedAt.getTime()).toBeLessThanOrEqual(after);
			expect(update).toHaveBeenCalledWith(acc);
		});

		it('throws when account not found', async () => {
			const repo = mockRepo({ findById: vi.fn().mockResolvedValue(null) });
			const svc = new AccountService(repo);

			await expect(svc.deactivate('nonexistent')).rejects.toThrow('Account not found');
		});
	});

	describe('delete', () => {
		it('delegates to repo.delete', async () => {
			const deleteFn = vi.fn().mockResolvedValue(undefined);
			const repo = mockRepo({ delete: deleteFn });
			const svc = new AccountService(repo);

			await svc.delete('acc-1');
			expect(deleteFn).toHaveBeenCalledWith('acc-1');
		});
	});

	describe('getActive', () => {
		it('returns only active accounts', async () => {
			const active = [makeAccount({ id: 'a1', isActive: true }), makeAccount({ id: 'a2', isActive: true })];
			const repo = mockRepo({ findActive: vi.fn().mockResolvedValue(active) });
			const svc = new AccountService(repo);

			const result = await svc.getActive();
			expect(result).toHaveLength(2);
			expect(result[0].isActive).toBe(true);
			expect(result[1].isActive).toBe(true);
		});
	});

	describe('getById', () => {
		it('returns account when found', async () => {
			const acc = makeAccount();
			const repo = mockRepo({ findById: vi.fn().mockResolvedValue(acc) });
			const svc = new AccountService(repo);

			const result = await svc.getById('acc-1');
			expect(result).toBe(acc);
		});

		it('returns null when not found', async () => {
			const repo = mockRepo({ findById: vi.fn().mockResolvedValue(null) });
			const svc = new AccountService(repo);

			const result = await svc.getById('nonexistent');
			expect(result).toBeNull();
		});
	});
});
