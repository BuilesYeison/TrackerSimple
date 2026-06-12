<script lang="ts">
	import type { SpendRatio } from '../helpers';

	let {
		totalIncome,
		totalExpense,
		spendRatio,
	}: {
		totalIncome: number;
		totalExpense: number;
		spendRatio: SpendRatio;
	} = $props();

	const expenseBarPct = $derived(Math.min(spendRatio.ratio * 100, 100));
	const surplusText = $derived(
		spendRatio.surplus >= 0
			? `+$${spendRatio.surplus.toLocaleString('es')}`
			: `-$${Math.abs(spendRatio.surplus).toLocaleString('es')}`,
	);
	const message = $derived(
		spendRatio.overspend
			? `Gastaste ${(spendRatio.ratio * 100 - 100).toFixed(0)}% más de lo que ingresaste`
			: `Gastaste el ${Math.round(spendRatio.ratio * 100)}% de tus ingresos`,
	);
</script>

<div class="rounded-xl bg-surface p-4">
	<h3 class="text-xs text-muted mb-3">¿Estoy gastando más de lo que gano?</h3>
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-2">
			<span class="text-xs text-income w-14">Ingresos</span>
			<div class="flex-1 h-6 rounded-full bg-surface-raised overflow-hidden">
				<div class="h-full rounded-full bg-income" style="width: 100%"></div>
			</div>
			<span class="text-xs text-income text-right w-24">+${totalIncome.toLocaleString('es')}</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-xs text-expense w-14">Gastos</span>
			<div class="flex-1 h-6 rounded-full bg-surface-raised overflow-hidden">
				<div class="h-full rounded-full bg-expense transition-all" style="width: {expenseBarPct}%"></div>
			</div>
			<span class="text-xs text-expense text-right w-24">-${totalExpense.toLocaleString('es')}</span>
		</div>
	</div>
	<div class="mt-3 flex items-baseline gap-1">
		<span class="text-sm font-medium {spendRatio.overspend ? 'text-expense' : 'text-income'}">{message}</span>
	</div>
	<div class="mt-1 text-xs text-muted">Diferencia: {surplusText}</div>
</div>
