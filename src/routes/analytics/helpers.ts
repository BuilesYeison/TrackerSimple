import type { MonthlyAggregate } from '$lib/domain/entities';
import { getMonthRangeLabels } from '$lib/utils/analytics-calc';

const CLAMP_BOUND = 999;

export interface PeriodComparison {
	currentNet: number;
	previousNet: number;
	percent: number;
	percentDisplay: string;
	direction: 'up' | 'down' | 'neutral';
	diff: number;
	hasPreviousData: boolean;
}

export interface SpendRatio {
	ratio: number;
	overspend: boolean;
	surplus: number;
}

export interface DonutSlice {
	name: string;
	amount: number;
	percent: number;
	color: string;
}

const DONUT_COLORS = [
	'#4ade80',
	'#f87171',
	'#a78bfa',
	'#38bdf8',
	'#f59e0b',
	'#fb923c',
	'#22d3ee',
	'#818cf8',
];

export function computePreviousPeriodRange(period: '3m' | '6m' | 'year'): { from: Date; to: Date } {
	const currentMonths = getMonthRangeLabels(period);
	const firstMonth = currentMonths[0];
	const count = currentMonths.length;
	const prevTo = new Date(firstMonth.getFullYear(), firstMonth.getMonth(), 0, 23, 59, 59, 999);
	const prevFrom = new Date(prevTo.getFullYear(), prevTo.getMonth() - count + 1, 1);
	return { from: prevFrom, to: prevTo };
}

function clampPercent(p: number): string {
	if (p > CLAMP_BOUND) return `>${CLAMP_BOUND}%`;
	if (p < -CLAMP_BOUND) return `<${-CLAMP_BOUND}%`;
	return `${p >= 0 ? '+' : ''}${p}%`;
}

export function computePeriodComparison(
	currentAgg: MonthlyAggregate[],
	previousAgg: MonthlyAggregate[],
): PeriodComparison {
	const currentNet = currentAgg.reduce((s, d) => s + d.income - d.expense, 0);
	const previousNet = previousAgg.reduce((s, d) => s + d.income - d.expense, 0);
	const hasPreviousData = previousAgg.length > 0;

	if (!hasPreviousData) {
		return {
			currentNet,
			previousNet,
			percent: 0,
			percentDisplay: '',
			direction: 'neutral',
			diff: currentNet,
			hasPreviousData: false,
		};
	}

	if (previousNet === 0) {
		const direction = currentNet > 0 ? 'up' : currentNet < 0 ? 'down' : 'neutral';
		const percent = currentNet > 0 ? 100 : currentNet < 0 ? -100 : 0;
		return {
			currentNet,
			previousNet,
			percent,
			percentDisplay: clampPercent(percent),
			direction,
			diff: currentNet - previousNet,
			hasPreviousData: true,
		};
	}

	const percent = Math.round(((currentNet - previousNet) / Math.abs(previousNet)) * 100);
	const direction = percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral';
	return {
		currentNet,
		previousNet,
		percent,
		percentDisplay: clampPercent(percent),
		direction,
		diff: currentNet - previousNet,
		hasPreviousData: true,
	};
}

export function computeSpendRatio(totalIncome: number, totalExpense: number): SpendRatio {
	const ratio = totalIncome > 0 ? totalExpense / totalIncome : 0;
	return { ratio, overspend: totalExpense > totalIncome, surplus: totalIncome - totalExpense };
}

export function computeDonutSlices(items: { name: string; amount: number }[]): DonutSlice[] {
	const total = items.reduce((s, i) => s + i.amount, 0);
	if (total === 0) return [];
	const top = items.slice(0, 8);
	const topTotal = top.reduce((s, i) => s + i.amount, 0);
	const slices: DonutSlice[] = top.map((item, i) => ({
		name: item.name,
		amount: item.amount,
		percent: (item.amount / total) * 100,
		color: DONUT_COLORS[i],
	}));
	if (items.length > 8) {
		const otherAmount = total - topTotal;
		slices.push({
			name: 'Otros',
			amount: otherAmount,
			percent: (otherAmount / total) * 100,
			color: '#6b7280',
		});
	}
	return slices;
}

export function formatShortAmount(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
	return n.toLocaleString('es');
}
