import type { MonthlyAggregate } from "$lib/domain/entities";

export function getMonthRangeLabels(period: "3m" | "6m" | "year"): Date[] {
	const now = new Date();
	const months: Date[] = [];

	let startMonth: number;
	let startYear: number;

	if (period === "3m") {
		const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
		startYear = d.getFullYear();
		startMonth = d.getMonth();
	} else if (period === "6m") {
		const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
		startYear = d.getFullYear();
		startMonth = d.getMonth();
	} else {
		startYear = now.getFullYear();
		startMonth = 0;
	}

	const count = period === "3m" ? 3 : period === "6m" ? 6 : now.getMonth() + 1;
	for (let i = 0; i < count; i++) {
		const m = startMonth + i;
		const y = startYear + Math.floor(m / 12);
		months.push(new Date(y, m % 12, 1));
	}

	return months;
}

export function sanitizeMonthlyData(data: MonthlyAggregate[]): MonthlyAggregate[] {
	return data.map((d) => ({
		...d,
		income: Number.isFinite(d.income) ? d.income : 0,
		expense: Number.isFinite(d.expense) ? d.expense : 0,
	}));
}

export function sanitizeCumulData<T extends { balance: number }>(data: T[]): T[] {
	return data.map((d) => ({
		...d,
		balance: Number.isFinite(d.balance) ? d.balance : 0,
	}));
}
