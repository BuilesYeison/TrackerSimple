import { describe, it, expect } from 'vitest';
import { createAccount } from '../Account';

describe('createAccount', () => {
	it('creates an account with required fields', () => {
		const acc = createAccount({ name: 'Efectivo', type: 'cash', currency: 'COP' });

		expect(acc.id).toBeTypeOf('string');
		expect(acc.id.length).toBeGreaterThan(0);
		expect(acc.name).toBe('Efectivo');
		expect(acc.type).toBe('cash');
		expect(acc.currency).toBe('COP');
		expect(acc.balance).toBe(0);
		expect(acc.isActive).toBe(true);
		expect(acc.createdAt).toBeInstanceOf(Date);
		expect(acc.updatedAt).toBeInstanceOf(Date);
		expect(acc.createdAt.getTime()).toBe(acc.updatedAt.getTime());
	});

	it('uses provided balance', () => {
		const acc = createAccount({ name: 'Nómina', type: 'debit', currency: 'USD', balance: 5000 });

		expect(acc.balance).toBe(5000);
		expect(acc.currency).toBe('USD');
		expect(acc.type).toBe('debit');
	});

	it('generates unique IDs', () => {
		const a = createAccount({ name: 'A', type: 'cash', currency: 'COP' });
		const b = createAccount({ name: 'B', type: 'cash', currency: 'COP' });

		expect(a.id).not.toBe(b.id);
	});

	it('sets createdAt and updatedAt to now', () => {
		const before = Date.now();
		const acc = createAccount({ name: 'X', type: 'credit', currency: 'EUR' });
		const after = Date.now();

		expect(acc.createdAt.getTime()).toBeGreaterThanOrEqual(before);
		expect(acc.createdAt.getTime()).toBeLessThanOrEqual(after);
	});

	it('defaults balance to 0 when not provided', () => {
		const acc = createAccount({ name: 'Ahorros', type: 'cash', currency: 'COP' });
		expect(acc.balance).toBe(0);
	});

	it('handles all account types', () => {
		const cash = createAccount({ name: 'E', type: 'cash', currency: 'COP' });
		const debit = createAccount({ name: 'D', type: 'debit', currency: 'COP' });
		const credit = createAccount({ name: 'C', type: 'credit', currency: 'COP' });

		expect(cash.type).toBe('cash');
		expect(debit.type).toBe('debit');
		expect(credit.type).toBe('credit');
	});
});
