import { describe, it, expect } from 'vitest';
import { getMonthRange, formatMonthLabel } from '../date-format';

describe('getMonthRange', () => {
	it('returns first and last day of the month', () => {
		const { from, to } = getMonthRange(2025, 0); // January

		expect(from.getFullYear()).toBe(2025);
		expect(from.getMonth()).toBe(0);
		expect(from.getDate()).toBe(1);

		expect(to.getFullYear()).toBe(2025);
		expect(to.getMonth()).toBe(0);
		expect(to.getDate()).toBe(31);
	});

	it('handles February in leap year', () => {
		const { to } = getMonthRange(2024, 1);
		expect(to.getDate()).toBe(29);
	});

	it('handles February in non-leap year', () => {
		const { to } = getMonthRange(2025, 1);
		expect(to.getDate()).toBe(28);
	});

	it('handles 30-day months', () => {
		const { to } = getMonthRange(2025, 3); // April
		expect(to.getDate()).toBe(30);
	});

	it('to is at end of day (23:59:59.999)', () => {
		const { to } = getMonthRange(2025, 0);
		expect(to.getHours()).toBe(23);
		expect(to.getMinutes()).toBe(59);
		expect(to.getSeconds()).toBe(59);
		expect(to.getMilliseconds()).toBe(999);
	});

	it('handles December to January transition', () => {
		const { from, to } = getMonthRange(2025, 11); // December
		expect(from.getMonth()).toBe(11);
		expect(from.getFullYear()).toBe(2025);
		expect(to.getMonth()).toBe(11);
		expect(to.getFullYear()).toBe(2025);
	});
});

describe('formatMonthLabel', () => {
	it('returns locale-formatted month and year', () => {
		const date = new Date(2025, 5, 15); // June 2025
		const label = formatMonthLabel(date);

		expect(label).toContain('2025');
	});

	it('returns different labels for different months', () => {
		const jan = formatMonthLabel(new Date(2025, 0, 1));
		const feb = formatMonthLabel(new Date(2025, 1, 1));

		expect(jan).not.toBe(feb);
	});
});
