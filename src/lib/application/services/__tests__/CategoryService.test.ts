import { describe, it, expect, vi } from 'vitest';
import { CategoryService } from '../CategoryService';
import type { ICategoryRepository } from '$lib/domain/repositories';
import type { Category } from '$lib/domain/entities';

function makeCategory(overrides: Partial<Category> = {}): Category {
	const now = new Date();
	return {
		id: 'cat-1',
		name: 'Comida',
		type: 'expense',
		isDefault: true,
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

function mockRepo(overrides: Partial<ICategoryRepository> = {}): ICategoryRepository {
	return {
		create: vi.fn().mockResolvedValue(undefined),
		update: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
		findById: vi.fn().mockResolvedValue(null),
		findAll: vi.fn().mockResolvedValue([]),
		findDefaults: vi.fn().mockResolvedValue([]),
		findByName: vi.fn().mockResolvedValue(null),
		findByNameAndType: vi.fn().mockResolvedValue(null),
		...overrides,
	} as unknown as ICategoryRepository;
}

describe('CategoryService', () => {
	describe('create', () => {
		it('creates a category when name+type is unique', async () => {
			const repo = mockRepo({ findByNameAndType: vi.fn().mockResolvedValue(null) });
			const svc = new CategoryService(repo);

			const cat = await svc.create({ name: 'Suscripciones', type: 'expense' });

			expect(cat.name).toBe('Suscripciones');
			expect(cat.type).toBe('expense');
			expect(cat.isDefault).toBe(false);
		});

		it('throws when a category with same name+type exists', async () => {
			const repo = mockRepo({
				findByNameAndType: vi.fn().mockResolvedValue(makeCategory({ name: 'Comida', type: 'expense' })),
			});
			const svc = new CategoryService(repo);

			await expect(svc.create({ name: 'Comida', type: 'expense' })).rejects.toThrow(
				'Ya existe una categoría "Comida" en ese tipo',
			);
		});

		it('allows same name with different type', async () => {
			const repo = mockRepo({ findByNameAndType: vi.fn().mockResolvedValue(null) });
			const svc = new CategoryService(repo);

			const expense = await svc.create({ name: 'Freelance', type: 'expense' });
			// Simulate: for income, findByNameAndType returns null (no income category with that name)
			const repo2 = mockRepo({ findByNameAndType: vi.fn().mockResolvedValue(null) });
			const svc2 = new CategoryService(repo2);
			const income = await svc2.create({ name: 'Freelance', type: 'income' });

			expect(expense.type).toBe('expense');
			expect(income.type).toBe('income');
			expect(expense.name).toBe('Freelance');
			expect(income.name).toBe('Freelance');
		});
	});

	describe('update', () => {
		it('updates timestamp and calls repo.update', async () => {
			const update = vi.fn().mockResolvedValue(undefined);
			const repo = mockRepo({
				update,
				findByNameAndType: vi.fn().mockResolvedValue(null),
			});
			const svc = new CategoryService(repo);

			const cat = makeCategory({ name: 'Renombrado' });
			const before = Date.now();
			await svc.update(cat);
			const after = Date.now();

			expect(cat.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
			expect(cat.updatedAt.getTime()).toBeLessThanOrEqual(after);
			expect(update).toHaveBeenCalledWith(cat);
		});

		it('throws when renaming to an existing name+type from different category', async () => {
			const existing = makeCategory({ id: 'cat-2', name: 'Transporte', type: 'expense' });
			const repo = mockRepo({
				findByNameAndType: vi.fn().mockResolvedValue(existing),
			});
			const svc = new CategoryService(repo);

			const cat = makeCategory({ id: 'cat-1', name: 'Transporte', type: 'expense' });
			await expect(svc.update(cat)).rejects.toThrow(
				'Ya existe una categoría "Transporte" en ese tipo',
			);
		});

		it('allows update when same name+type belongs to the same category', async () => {
			const update = vi.fn().mockResolvedValue(undefined);
			const cat = makeCategory({ id: 'cat-1', name: 'Comida', type: 'expense' });
			const repo = mockRepo({
				update,
				findByNameAndType: vi.fn().mockResolvedValue(cat), // Same id
			});
			const svc = new CategoryService(repo);

			// Should not throw because existing.id === category.id
			await expect(svc.update(cat)).resolves.toBeUndefined();
			expect(update).toHaveBeenCalledWith(cat);
		});
	});

	describe('delete', () => {
		it('delegates to repo.delete', async () => {
			const deleteFn = vi.fn().mockResolvedValue(undefined);
			const repo = mockRepo({ delete: deleteFn });
			const svc = new CategoryService(repo);

			await svc.delete('cat-1');
			expect(deleteFn).toHaveBeenCalledWith('cat-1');
		});
	});

	describe('getDefaults', () => {
		it('returns default categories from repo', async () => {
			const defaults = [
				makeCategory({ id: 'c1', name: 'Comida', isDefault: true }),
				makeCategory({ id: 'c2', name: 'Transporte', isDefault: true }),
			];
			const repo = mockRepo({ findDefaults: vi.fn().mockResolvedValue(defaults) });
			const svc = new CategoryService(repo);

			const result = await svc.getDefaults();
			expect(result).toHaveLength(2);
			expect(result.every((c) => c.isDefault)).toBe(true);
		});
	});
});
