import { describe, it, expect } from 'vitest';
import { DEFAULT_CATEGORIES } from '../default-categories';

describe('DEFAULT_CATEGORIES', () => {
	it('has exactly 14 default categories', () => {
		expect(DEFAULT_CATEGORIES).toHaveLength(14);
	});

	it('has 11 expense and 3 income categories', () => {
		const expenses = DEFAULT_CATEGORIES.filter((c) => c.type === 'expense');
		const incomes = DEFAULT_CATEGORIES.filter((c) => c.type === 'income');

		expect(expenses).toHaveLength(11);
		expect(incomes).toHaveLength(3);
	});

	it('contains expected expense categories', () => {
		const names = DEFAULT_CATEGORIES.filter((c) => c.type === 'expense').map((c) => c.name);
		expect(names).toContain('Comida');
		expect(names).toContain('Transporte');
		expect(names).toContain('Salud');
		expect(names).toContain('Educación');
		expect(names).toContain('Vivienda');
		expect(names).toContain('Automóvil');
		expect(names).toContain('Deportes');
		expect(names).toContain('Entretenimiento');
		expect(names).toContain('Mascotas');
		expect(names).toContain('Regalos');
		expect(names).toContain('Ropa');
	});

	it('contains expected income categories', () => {
		const names = DEFAULT_CATEGORIES.filter((c) => c.type === 'income').map((c) => c.name);
		expect(names).toContain('Salario');
		expect(names).toContain('Depósitos');
		expect(names).toContain('Ahorros');
	});

	it('has no duplicate names', () => {
		const names = DEFAULT_CATEGORIES.map((c) => c.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it('all categories have name and type', () => {
		for (const cat of DEFAULT_CATEGORIES) {
			expect(cat.name).toBeTruthy();
			expect(cat.type).toBeTruthy();
			expect(['expense', 'income']).toContain(cat.type);
		}
	});
});
