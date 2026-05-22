<script lang="ts">
	let {
		categories,
	}: {
		categories: { name: string; amount: number; maxAmount: number }[];
	} = $props();

	function getPct(amount: number, max: number): number {
		if (max === 0) return 0;
		return (amount / max) * 100;
	}
</script>

{#if categories.length > 0}
	<div class="flex flex-col gap-3">
		<h2 class="text-sm font-medium text-foreground">En qué gastaste más</h2>
		{#each categories as { name, amount, maxAmount }}
			<div class="flex items-center gap-3">
				<span class="w-24 text-sm text-muted truncate">{name}</span>
				<div class="flex-1 h-2 rounded-full bg-surface overflow-hidden">
					<div
						class="h-full rounded-full bg-expense"
						style="width: {getPct(amount, maxAmount)}%"
					></div>
				</div>
				<span class="w-20 text-right text-sm font-medium text-expense">
					-${amount.toLocaleString("es")}
				</span>
			</div>
		{/each}
	</div>
{/if}
