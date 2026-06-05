import { describe, it, expect } from 'vitest';
import { createCategory } from '../Category';
import type { CategoryType } from '../Category';

describe('createCategory', () => {
	it('creates a category with required fields', () => {
		const cat = createCategory({ name: 'Suscripciones', type: 'expense' });

		expect(cat.id).toBeTypeOf('string');
		expect(cat.id.length).toBeGreaterThan(0);
		expect(cat.name).toBe('Suscripciones');
		expect(cat.type).toBe('expense');
		expect(cat.isDefault).toBe(false);
		expect(cat.createdAt).toBeInstanceOf(Date);
		expect(cat.updatedAt).toBeInstanceOf(Date);
	});

	it('creates an income category', () => {
		const cat = createCategory({ name: 'Freelance', type: 'income' });

		expect(cat.type).toBe('income');
		expect(cat.name).toBe('Freelance');
	});

	it('marks default categories correctly', () => {
		const cat = createCategory({ name: 'Comida', type: 'expense', isDefault: true });

		expect(cat.isDefault).toBe(true);
	});

	it('defaults isDefault to false', () => {
		const cat = createCategory({ name: 'Personalizado', type: 'expense' });

		expect(cat.isDefault).toBe(false);
	});

	it('generates unique IDs', () => {
		const a = createCategory({ name: 'A', type: 'expense' });
		const b = createCategory({ name: 'A', type: 'expense' });

		expect(a.id).not.toBe(b.id);
	});

	it('sets timestamps equal on creation', () => {
		const cat = createCategory({ name: 'X', type: 'income' });

		expect(cat.createdAt.getTime()).toBe(cat.updatedAt.getTime());
	});

	it('handles both category types', () => {
		const types: CategoryType[] = ['expense', 'income'];

		for (const type of types) {
			const cat = createCategory({ name: `Cat ${type}`, type });
			expect(cat.type).toBe(type);
		}
	});
});
