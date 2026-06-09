<script lang="ts">
	import { TrendingUp, TrendingDown, Minus } from '@lucide/svelte';
	import type { PeriodComparison } from '../helpers';
	import { formatShortAmount } from '../helpers';

	let {
		comparison,
		monthlyAgg,
	}: {
		comparison: PeriodComparison;
		monthlyAgg: { label: string; net: number }[];
	} = $props();

	const maxNet = $derived(Math.max(...monthlyAgg.map((d) => Math.abs(d.net)), 1));

	const ArrowIcon = $derived(
		comparison.direction === 'up'
			? TrendingUp
			: comparison.direction === 'down'
				? TrendingDown
				: Minus,
	);
	const arrowColor = $derived(
		comparison.direction === 'up'
			? 'text-income'
			: comparison.direction === 'down'
				? 'text-expense'
				: 'text-muted',
	);
	const periodNetText = $derived(
		comparison.currentNet >= 0
			? `+$${formatShortAmount(comparison.currentNet)}`
			: `-$${formatShortAmount(Math.abs(comparison.currentNet))}`,
	);
	const prevNetText = $derived(
		comparison.previousNet >= 0
			? `+$${formatShortAmount(comparison.previousNet)}`
			: `-$${formatShortAmount(Math.abs(comparison.previousNet))}`,
	);
	const diffText = $derived(
		comparison.diff >= 0
			? `+$${formatShortAmount(comparison.diff)}`
			: `-$${formatShortAmount(Math.abs(comparison.diff))}`,
	);
	const message = $derived(
		comparison.direction === 'up'
			? 'Ahorraste más que el período anterior'
			: comparison.direction === 'down'
				? 'Ahorraste menos que el período anterior'
				: 'Ahorraste igual que el período anterior',
	);
	const showComparison = $derived(comparison.hasPreviousData);
</script>

<div class="rounded-xl bg-surface p-4">
	<div class="flex items-center justify-between">
		<h3 class="text-xs text-muted">¿Tengo más dinero que el período anterior?</h3>
		{#if showComparison}
			<div class="flex items-center gap-1 {arrowColor}">
				{#if ArrowIcon !== Minus}
					<svelte:component this={ArrowIcon} size={20} />
				{/if}
				<span class="text-xl font-bold">{comparison.percentDisplay}</span>
			</div>
		{/if}
	</div>
	{#if showComparison}
		<div class="mt-2 text-sm">{message}</div>
		<div class="mt-1 flex gap-3 text-xs text-muted">
			<span>Este período: {periodNetText}</span>
			<span>Anterior: {prevNetText}</span>
		</div>
		<div class="mt-1 text-xs text-muted">Diferencia: {diffText}</div>
	{:else}
		<div class="mt-3 text-sm">{periodNetText}</div>
		<div class="mt-1 text-xs text-muted">Aún no hay datos del período anterior para comparar</div>
	{/if}
	{#if monthlyAgg.length > 1}
		<div class="mt-3 flex items-end gap-1 h-12">
			{#each monthlyAgg as m}
				{@const h = Math.max(3, (Math.abs(m.net) / maxNet) * 40)}
				<div class="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
					<div class="w-full rounded-sm {m.net >= 0 ? 'bg-income' : 'bg-expense'}" style="height: {h}px"></div>
					<span class="text-[8px] text-muted leading-none">{m.label}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
