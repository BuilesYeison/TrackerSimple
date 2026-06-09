<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import {
		accountService,
		categoryService,
		analyticsService,
		workspaceReady,
	} from '$lib/presentation/stores/workspace';
	import { getMonthRangeLabels } from '$lib/utils/analytics-calc';
	import type { Account, Category, MonthlyAggregate } from '$lib/domain/entities';
	import {
		computePreviousPeriodRange,
		computePeriodComparison,
		computeSpendRatio,
		computeDonutSlices,
	} from './helpers';
	import PeriodSelector from './components/PeriodSelector.svelte';
	import WealthComparison from './components/WealthComparison.svelte';
	import OverspendIndicator from './components/OverspendIndicator.svelte';
	import SpendingBreakdown from './components/SpendingBreakdown.svelte';

	let period = $state<'3m' | '6m' | 'year'>('6m');
	let accounts = $state<Account[]>([]);
	let categories = $state<Category[]>([]);
	let currentAgg = $state<MonthlyAggregate[]>([]);
	let previousAgg = $state<MonthlyAggregate[]>([]);
	let categoryTotals = $state<{ name: string; amount: number }[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			await workspaceReady;
			accounts = await accountService.getActive();
			categories = await categoryService.getAll();
			await loadData();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al cargar datos';
			toast.error(error);
		} finally {
			loading = false;
		}
	});

	async function loadData() {
		const months = getMonthRangeLabels(period);
		const from = months[0];
		const to = new Date(
			months[months.length - 1].getFullYear(),
			months[months.length - 1].getMonth() + 1,
			0, 23, 59, 59,
		);
		const prevPeriod = computePreviousPeriodRange(period);

		const [curr, prev, totals] = await Promise.all([
			analyticsService.getMonthlyAggregation(from, to),
			analyticsService.getMonthlyAggregation(prevPeriod.from, prevPeriod.to),
			analyticsService.getCategoryTotals(from, to, 'expense'),
		]);

		currentAgg = curr;
		previousAgg = prev;
		categoryTotals = totals
			.map((t) => ({
				name: categories.find((c) => c.id === t.categoryId)?.name ?? '—',
				amount: t.total,
			}))
			.sort((a, b) => b.amount - a.amount);
	}

	async function changePeriod(p: '3m' | '6m' | 'year') {
		period = p;
		loading = true;
		try {
			await loadData();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Error al cargar');
		} finally {
			loading = false;
		}
	}

	const months = $derived(getMonthRangeLabels(period));

	const monthlyAgg = $derived.by(() => {
		return months.map((m) => {
			const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
			const label = m.toLocaleDateString('es', { month: 'short', year: '2-digit' });
			const found = currentAgg.find((d) => d.month === key);
			return {
				month: key,
				label,
				income: found?.income ?? 0,
				expense: found?.expense ?? 0,
			};
		});
	});

	const totalIncome = $derived(monthlyAgg.reduce((s, d) => s + d.income, 0));
	const totalExpense = $derived(monthlyAgg.reduce((s, d) => s + d.expense, 0));

	const comparison = $derived(computePeriodComparison(currentAgg, previousAgg));
	const spendRatio = $derived(computeSpendRatio(totalIncome, totalExpense));
	const donutSlices = $derived(computeDonutSlices(categoryTotals));

	const hasData = $derived(monthlyAgg.some((d) => d.income > 0 || d.expense > 0));

	const monthlyNet = $derived(
		monthlyAgg.map((d) => ({ label: d.label, net: d.income - d.expense })),
	);
</script>

<div class="mx-auto flex max-w-md flex-col gap-6 p-4">
	<h1 class="text-2xl font-bold">Analítica</h1>

	<PeriodSelector value={period} onchange={changePeriod} />

	{#if error}
		<div class="flex flex-col items-center gap-3 py-12">
			<span class="text-sm text-expense">{error}</span>
			<button
				onclick={() => window.location.reload()}
				class="rounded-lg bg-surface-raised px-4 py-2 text-sm text-foreground transition-colors hover:opacity-80"
			>Reintentar</button>
		</div>
	{:else if loading}
		<div class="flex flex-col gap-4">
			<div class="h-24 animate-pulse rounded-xl bg-surface"></div>
			<div class="h-28 animate-pulse rounded-xl bg-surface"></div>
			<div class="h-56 animate-pulse rounded-xl bg-surface"></div>
		</div>
	{:else if !hasData}
		<div class="flex flex-col items-center gap-2 py-12 text-muted">
			<span class="text-sm">Sin datos para este período</span>
		</div>
	{:else}
		<WealthComparison {comparison} monthlyAgg={monthlyNet} />

		<OverspendIndicator {totalIncome} {totalExpense} {spendRatio} />

		<SpendingBreakdown slices={donutSlices} />
	{/if}
</div>
