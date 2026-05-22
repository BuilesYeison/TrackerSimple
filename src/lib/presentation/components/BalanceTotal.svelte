<script lang="ts">
	let {
		balance,
		currency,
		monthLabel,
	}: {
		balance: number;
		currency: string;
		monthLabel: string;
	} = $props();

	const sign = $derived(balance >= 0 ? "+" : "-");
	const balanceColor = $derived(
		balance >= 0 ? "text-income" : "text-expense",
	);
	const display = $derived(
		`${sign}$${Math.abs(balance).toLocaleString("es")}`,
	);
</script>

<div class="text-center py-6">
	<div class="text-5xl font-light {balanceColor}">{display}</div>
	<div class="mt-1 text-xs text-muted">balance total · {monthLabel}</div>
</div>
