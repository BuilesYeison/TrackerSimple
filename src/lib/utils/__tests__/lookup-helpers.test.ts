import { describe, it, expect } from 'vitest';
import { lookupAccount, lookupCategory } from '../lookup-helpers';
import type { Account, Category } from '$lib/domain/entities';

const mockAccounts: Account[] = [
	{ id: 'a1', name: 'Efectivo', type: 'cash', currency: 'COP', balance: 1000, isActive: true, createdAt: new Date(), updatedAt: new Date() },
	{ id: 'a2', name: 'Nómina', type: 'debit', currency: 'COP', balance: 5000, isActive: true, createdAt: new Date(), updatedAt: new Date() },
	{ id: 'a3', name: 'Tarjeta', type: 'credit', currency: 'USD', balance: -2000, isActive: false, createdAt: new Date(), updatedAt: new Date() },
];

const mockCategories: Category[] = [
	{ id: 'c1', name: 'Comida', type: 'expense', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
	{ id: 'c2', name: 'Salario', type: 'income', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
];

describe('lookupAccount', () => {
	it('returns account name when found', () => {
		expect(lookupAccount(mockAccounts, 'a1')).toBe('Efectivo');
		expect(lookupAccount(mockAccounts, 'a2')).toBe('Nómina');
	});

	it('returns "—" when not found', () => {
		expect(lookupAccount(mockAccounts, 'nonexistent')).toBe('—');
	});

	it('returns "—" for empty array', () => {
		expect(lookupAccount([], 'a1')).toBe('—');
	});

	it('finds inactive accounts', () => {
		expect(lookupAccount(mockAccounts, 'a3')).toBe('Tarjeta');
	});
});

describe('lookupCategory', () => {
	it('returns category name when found', () => {
		expect(lookupCategory(mockCategories, 'c1')).toBe('Comida');
		expect(lookupCategory(mockCategories, 'c2')).toBe('Salario');
	});

	it('returns "—" when not found', () => {
		expect(lookupCategory(mockCategories, 'nonexistent')).toBe('—');
	});

	it('returns "—" for empty array', () => {
		expect(lookupCategory([], 'c1')).toBe('—');
	});
});
