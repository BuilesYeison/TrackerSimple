import { describe, it, expect } from 'vitest';
import { createRecord } from '../Record';

describe('createRecord', () => {
	it('creates an expense record with required fields', () => {
		const rec = createRecord({
			type: 'expense',
			amount: 25000,
			accountId: 'acc-1',
			categoryId: 'cat-1',
		});

		expect(rec.id).toBeTypeOf('string');
		expect(rec.id.length).toBeGreaterThan(0);
		expect(rec.type).toBe('expense');
		expect(rec.amount).toBe(25000);
		expect(rec.accountId).toBe('acc-1');
		expect(rec.toAccountId).toBeNull();
		expect(rec.categoryId).toBe('cat-1');
		expect(rec.note).toBeNull();
		expect(rec.tag).toBeNull();
		expect(rec.date).toBeInstanceOf(Date);
		expect(rec.createdAt).toBeInstanceOf(Date);
		expect(rec.updatedAt).toBeInstanceOf(Date);
	});

	it('creates a transfer record with toAccountId', () => {
		const rec = createRecord({
			type: 'transfer',
			amount: 100000,
			accountId: 'acc-1',
			toAccountId: 'acc-2',
			categoryId: 'cat-transfer',
		});

		expect(rec.type).toBe('transfer');
		expect(rec.toAccountId).toBe('acc-2');
	});

	it('creates an income record', () => {
		const rec = createRecord({
			type: 'income',
			amount: 500000,
			accountId: 'acc-1',
			categoryId: 'cat-salary',
		});

		expect(rec.type).toBe('income');
		expect(rec.toAccountId).toBeNull();
	});

	it('preserves note and tag when provided', () => {
		const rec = createRecord({
			type: 'expense',
			amount: 15000,
			accountId: 'acc-1',
			categoryId: 'cat-1',
			note: 'Almuerzo con cliente',
			tag: 'trabajo',
		});

		expect(rec.note).toBe('Almuerzo con cliente');
		expect(rec.tag).toBe('trabajo');
	});

	it('generates unique IDs', () => {
		const a = createRecord({ type: 'expense', amount: 100, accountId: 'a', categoryId: 'c' });
		const b = createRecord({ type: 'expense', amount: 100, accountId: 'a', categoryId: 'c' });

		expect(a.id).not.toBe(b.id);
	});

	it('uses provided date when given', () => {
		const customDate = new Date('2025-01-15');
		const rec = createRecord({
			type: 'expense',
			amount: 5000,
			accountId: 'a',
			categoryId: 'c',
			date: customDate,
		});

		expect(rec.date).toBe(customDate);
	});

	it('defaults toAccountId to null for non-transfer records', () => {
		const rec = createRecord({
			type: 'expense',
			amount: 100,
			accountId: 'a',
			categoryId: 'c',
		});

		expect(rec.toAccountId).toBeNull();
	});
});
