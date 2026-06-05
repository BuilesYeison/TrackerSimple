import { describe, it, expect } from 'vitest';
import { getMonthRangeLabels, sanitizeMonthlyData, sanitizeCumulData } from '../analytics-calc';
import type { MonthlyAggregate } from '$lib/domain/entities';

describe('getMonthRangeLabels', () => {
	it('returns 3 months for "3m"', () => {
		const labels = getMonthRangeLabels('3m');
		expect(labels).toHaveLength(3);
	});

	it('returns 6 months for "6m"', () => {
		const labels = getMonthRangeLabels('6m');
		expect(labels).toHaveLength(6);
	});

	it('returns current month index + 1 for "year"', () => {
		const now = new Date();
		const labels = getMonthRangeLabels('year');
		expect(labels).toHaveLength(now.getMonth() + 1);
	});

	it('returns sequential months starting from 2 months ago for 3m', () => {
		const labels = getMonthRangeLabels('3m');
		for (let i = 1; i < labels.length; i++) {
			const prev = labels[i - 1];
			const curr = labels[i];
			const expectedNext = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
			expect(curr.getTime()).toBe(expectedNext.getTime());
		}
	});

	it('returns sequential months for 6m', () => {
		const labels = getMonthRangeLabels('6m');
		for (let i = 1; i < labels.length; i++) {
			const prev = labels[i - 1];
			const curr = labels[i];
			const expectedNext = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
			expect(curr.getTime()).toBe(expectedNext.getTime());
		}
	});

	it('returns dates with day = 1', () => {
		for (const period of ['3m', '6m', 'year'] as const) {
			const labels = getMonthRangeLabels(period);
			for (const d of labels) {
				expect(d.getDate()).toBe(1);
			}
		}
	});

	it('wraps months correctly across year boundary when needed', () => {
		// Jan 2026: 3m would include Nov 2025, Dec 2025, Jan 2026
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();

		if (currentMonth < 2) {
			const labels = getMonthRangeLabels('3m');
			const months = labels.map((d) => d.getMonth());
			const years = labels.map((d) => d.getFullYear());
			// Should include previous year
			const hasPrevYear = years.some((y) => y < currentYear);
			expect(hasPrevYear).toBe(true);
		}
	});
});

describe('sanitizeMonthlyData', () => {
	it('passes through valid data', () => {
		const input: MonthlyAggregate[] = [
			{ month: '2025-06', income: 500000, expense: 200000 },
			{ month: '2025-05', income: 0, expense: 0 },
		];
		const result = sanitizeMonthlyData(input);
		expect(result).toEqual(input);
	});

	it('replaces NaN with 0', () => {
		const input: MonthlyAggregate[] = [
			{ month: '2025-06', income: NaN, expense: NaN },
		];
		const result = sanitizeMonthlyData(input);
		expect(result[0].income).toBe(0);
		expect(result[0].expense).toBe(0);
	});

	it('replaces Infinity with 0', () => {
		const input: MonthlyAggregate[] = [
			{ month: '2025-06', income: Infinity, expense: -Infinity },
		];
		const result = sanitizeMonthlyData(input);
		expect(result[0].income).toBe(0);
		expect(result[0].expense).toBe(0);
	});

	it('handles empty array', () => {
		expect(sanitizeMonthlyData([])).toEqual([]);
	});

	it('preserves month field untouched', () => {
		const input: MonthlyAggregate[] = [
			{ month: '2025-12', income: 100, expense: 50 },
		];
		const result = sanitizeMonthlyData(input);
		expect(result[0].month).toBe('2025-12');
	});
});

describe('sanitizeCumulData', () => {
	it('passes through valid data', () => {
		const input = [
			{ month: '2025-06', label: 'jun 2025', balance: 50000 },
			{ month: '2025-07', label: 'jul 2025', balance: 0 },
		];
		const result = sanitizeCumulData(input);
		expect(result).toEqual(input);
	});

	it('replaces NaN with 0', () => {
		const input = [
			{ month: '2025-06', label: 'jun 2025', balance: NaN },
		];
		const result = sanitizeCumulData(input);
		expect(result[0].balance).toBe(0);
	});

	it('replaces Infinity with 0', () => {
		const input = [
			{ month: '2025-06', label: 'jun 2025', balance: Infinity },
		];
		const result = sanitizeCumulData(input);
		expect(result[0].balance).toBe(0);
	});

	it('handles empty array', () => {
		expect(sanitizeCumulData([])).toEqual([]);
	});

	it('preserves extra fields', () => {
		const input = [{ month: '2025-06', label: 'jun', balance: 100, extra: 'keep' }] as any[];
		const result = sanitizeCumulData(input) as any[];
		expect(result[0].extra).toBe('keep');
		expect(result[0].label).toBe('jun');
	});
});
