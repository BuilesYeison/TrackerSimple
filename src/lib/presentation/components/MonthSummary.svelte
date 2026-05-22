<script lang="ts">
	let {
		income,
		expense,
	}: {
		income: number;
		expense: number;
	} = $props();

	const incomeDisplay = $derived(`+$${income.toLocaleString("es")}`);
	const expenseDisplay = $derived(`-$${expense.toLocaleString("es")}`);
</script>

<div class="grid grid-cols-2 gap-3">
	<div class="rounded-xl bg-surface p-4">
		<div class="text-xs text-muted">Ingresos</div>
		<div class="mt-1 text-lg font-semibold text-income">{incomeDisplay}</div>
	</div>
	<div class="rounded-xl bg-surface p-4">
		<div class="text-xs text-muted">Gastos</div>
		<div class="mt-1 text-lg font-semibold text-expense">{expenseDisplay}</div>
	</div>
</div>
