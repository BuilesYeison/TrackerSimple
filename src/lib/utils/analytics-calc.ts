import type { Record, Account, Category } from "$lib/domain/entities";

export interface MonthlyData {
	month: string;
	label: string;
	income: number;
	expense: number;
}

export interface CumulativeData {
	month: string;
	label: string;
	balance: number;
}

export interface CategoryData {
	name: string;
	amount: number;
}

export function groupByMonth(
	records: Record[],
	months: Date[],
): MonthlyData[] {
	const map = new Map<string, MonthlyData>();
	for (const m of months) {
		const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
		const label = m.toLocaleDateString("es", { month: "short", year: "2-digit" });
		map.set(key, { month: key, label, income: 0, expense: 0 });
	}

	for (const r of records) {
		if (r.type === "transfer") continue;
		const d = r.date instanceof Date ? r.date : new Date(r.date);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		const entry = map.get(key);
		if (!entry) continue;
		if (r.type === "income") entry.income += r.amount;
		if (r.type === "expense") entry.expense += r.amount;
	}

	return Array.from(map.values());
}

export function cumulativeBalance(
	records: Record[],
	accounts: Account[],
	months: Date[],
): CumulativeData[] {
	// balance inicial = suma de balances iniciales de todas las cuentas
	const initialBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);

	// calcular delta por mes — cuánto cambió el balance en cada mes
	const deltaMap = new Map<string, number>();
	for (const m of months) {
		const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
		deltaMap.set(key, 0);
	}

	for (const r of records) {
		const d = r.date instanceof Date ? r.date : new Date(r.date);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		if (!deltaMap.has(key)) continue;

		const current = deltaMap.get(key)!;
		if (r.type === 'income') deltaMap.set(key, current + r.amount);
		if (r.type === 'expense') deltaMap.set(key, current - r.amount);
		// transfers no afectan el balance total
	}

	// acumular mes a mes partiendo del balance inicial
	const result: CumulativeData[] = [];
	let running = initialBalance;

	for (const m of months) {
		const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
		const label = m.toLocaleDateString('es', { month: 'short', year: '2-digit' });
		running += deltaMap.get(key) ?? 0;
		result.push({ month: key, label, balance: running });
	}

	return result;
}

export function topExpenseCategories(
	records: Record[],
	categories: Category[],
): CategoryData[] {
	const map = new Map<string, number>();
	for (const r of records) {
		if (r.type !== "expense") continue;
		map.set(r.categoryId, (map.get(r.categoryId) ?? 0) + r.amount);
	}

	const result = Array.from(map.entries())
		.map(([id, amount]) => ({
			name: categories.find((c) => c.id === id)?.name ?? "—",
			amount,
		}))
		.sort((a, b) => b.amount - a.amount);

	return result;
}

export function getMonthRange(period: "3m" | "6m" | "year"): Date[] {
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

export function sanitizeMonthlyData(data: MonthlyData[]): MonthlyData[] {
	return data.map(d => ({
		...d,
		income: isFinite(d.income) ? d.income : 0,
		expense: isFinite(d.expense) ? d.expense : 0,
	}));
}

export function sanitizeCumulData(data: CumulativeData[]): CumulativeData[] {
	return data.map(d => ({
		...d,
		balance: isFinite(d.balance) ? d.balance : 0,
	}));
}
