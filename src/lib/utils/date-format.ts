export function formatGroupDate(dateStr: string): string {
	const date = new Date(dateStr + 'T00:00:00');
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	const dateOnly = date.toISOString().split('T')[0];
	const todayOnly = today.toISOString().split('T')[0];
	const yesterdayOnly = yesterday.toISOString().split('T')[0];

	const formatted = date.toLocaleDateString('es', { day: 'numeric', month: 'long' });

	if (dateOnly === todayOnly) return `Hoy — ${formatted}`;
	if (dateOnly === yesterdayOnly) return `Ayer — ${formatted}`;
	return formatted;
}

export function getMonthRange(year: number, month: number): { from: Date; to: Date } {
	const from = new Date(year, month, 1);
	const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
	return { from, to };
}

export function formatMonthLabel(date: Date): string {
	return date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
}
