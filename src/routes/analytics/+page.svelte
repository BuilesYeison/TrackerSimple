<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { accountService, categoryService, recordService, workspaceReady } from "$lib/presentation/stores/workspace";
	import { groupByMonth, cumulativeBalance, topExpenseCategories, getMonthRangeLabels, sanitizeMonthlyData, sanitizeCumulData } from "$lib/utils/analytics-calc";
	import type { Account, Category, Record } from "$lib/domain/entities";

	let period = $state<"3m" | "6m" | "year">("6m");
	let accounts = $state<Account[]>([]);
	let categories = $state<Category[]>([]);
	let allRecords = $state<Record[]>([]);
	let loading = $state(true);
	let error = $state("");

	onMount(async () => {
		try {
			await workspaceReady;
			accounts = await accountService.getActive();
			categories = await categoryService.getAll();
			await loadData();
		} catch (err) {
			error = err instanceof Error ? err.message : "Error al cargar datos";
			toast.error(error);
		} finally {
			loading = false;
		}
	});

	async function loadData() {
		const months = getMonthRangeLabels(period);
		const from = months[0];
		const to = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 0, 23, 59, 59);
		allRecords = await recordService.getByDateRange(from, to);
	}

	async function changePeriod(p: "3m" | "6m" | "year") {
		period = p;
		loading = true;
		try {
			await loadData();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al cargar");
		} finally {
			loading = false;
		}
	}

	const months = $derived(getMonthRangeLabels(period));
	const rawMonthly = $derived(groupByMonth(allRecords, months));
	const rawCumul = $derived(cumulativeBalance(allRecords, accounts, months));
	const categoryData = $derived(topExpenseCategories(allRecords, categories));

	const monthlyData = $derived(sanitizeMonthlyData(rawMonthly));
	const cumulData = $derived(sanitizeCumulData(rawCumul));

	const totalIncome = $derived(monthlyData.reduce((s, d) => s + d.income, 0));
	const totalExpense = $derived(monthlyData.reduce((s, d) => s + d.expense, 0));
	const netSavings = $derived(totalIncome - totalExpense);

	const maxNet = $derived(Math.max(...monthlyData.map((d) => Math.abs(d.income - d.expense)), 1));
	const minCumul = $derived(Math.min(...cumulData.map((d) => d.balance), 0));
	const maxCumul = $derived(Math.max(...cumulData.map((d) => d.balance), 1));
	const cumulRange = $derived(maxCumul - minCumul || 1);

	const top5 = $derived(categoryData.slice(0, 5));
	const maxCategory = $derived(categoryData[0]?.amount ?? 1);
	const totalCategoryExpense = $derived(categoryData.reduce((s, c) => s + c.amount, 0));

	const hasData = $derived(monthlyData.some((d) => d.income > 0 || d.expense > 0));

	const svgW = $derived(months.length * 40 + 40);
	const svgH = 140;
	const svgPad = $derived(20);

	function formatY(n: number): string {
		if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
		if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
		return n.toLocaleString("es");
	}

	function barPct(value: number, max: number): number {
		if (max === 0) return 0;
		return Math.max(2, (value / max) * 100);
	}

	function showLabel(index: number, total: number): boolean {
		if (total <= 6) return true;
		return index % 2 === 0;
	}

	function cumulX(i: number): number {
		return svgPad + i * 40 + 20;
	}

	function cumulY(balance: number): number {
		return svgH - svgPad - ((balance - minCumul) / cumulRange) * (svgH - svgPad * 2);
	}

	const savingsSign = $derived(netSavings >= 0 ? "+" : "");
</script>

<div class="mx-auto flex max-w-md flex-col gap-6 p-4">
	<h1 class="text-2xl font-bold">Analítica</h1>

	<div class="grid grid-cols-3 gap-2 rounded-xl bg-surface p-1">
		<button class="rounded-xl py-2 text-sm font-medium transition-colors {period === '3m' ? 'bg-primary text-primary-foreground' : 'text-muted'}" onclick={() => changePeriod("3m")}>3 meses</button>
		<button class="rounded-xl py-2 text-sm font-medium transition-colors {period === '6m' ? 'bg-primary text-primary-foreground' : 'text-muted'}" onclick={() => changePeriod("6m")}>6 meses</button>
		<button class="rounded-xl py-2 text-sm font-medium transition-colors {period === 'year' ? 'bg-primary text-primary-foreground' : 'text-muted'}" onclick={() => changePeriod("year")}>Este año</button>
	</div>

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
			<div class="h-20 animate-pulse rounded-xl bg-surface"></div>
			<div class="h-40 animate-pulse rounded-xl bg-surface"></div>
			<div class="h-40 animate-pulse rounded-xl bg-surface"></div>
		</div>
	{:else if !hasData}
		<div class="flex flex-col items-center gap-2 py-12 text-muted">
			<span class="text-sm">Sin datos para este período</span>
		</div>
	{:else}
		<div class="grid grid-cols-3 gap-3">
			<div class="rounded-xl bg-surface p-4 text-center">
				<div class="text-xs text-muted">Ingresos</div>
				<div class="mt-1 text-sm font-semibold text-income">+${formatY(totalIncome)}</div>
			</div>
			<div class="rounded-xl bg-surface p-4 text-center">
				<div class="text-xs text-muted">Gastos</div>
				<div class="mt-1 text-sm font-semibold text-expense">-${formatY(totalExpense)}</div>
			</div>
			<div class="rounded-xl bg-surface p-4 text-center">
				<div class="text-xs text-muted">Ahorro neto</div>
				<div class="mt-1 text-sm font-semibold {netSavings >= 0 ? 'text-income' : 'text-expense'}">{savingsSign}${formatY(Math.abs(netSavings))}</div>
			</div>
		</div>

		<div>
			<h2 class="mb-3 text-sm font-medium text-foreground">Flujo de caja</h2>
			<div class="flex items-end gap-1 h-40 relative">
				<div class="absolute top-1/2 left-0 right-0 border-t border-muted/20 -translate-y-px"></div>
				{#each monthlyData as d, i}
					{@const net = d.income - d.expense}
					{@const h = Math.max(4, (Math.abs(net) / maxNet) * 100)}
					<div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
						<div class="w-full flex items-end h-full">
							<div class="w-full rounded-sm {net >= 0 ? 'bg-income' : 'bg-expense'}" style="height: {h}%"></div>
						</div>
						{#if showLabel(i, months.length)}
							<span class="text-[10px] text-muted">{d.label}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<div>
			<h2 class="mb-3 text-sm font-medium text-foreground">Balance acumulado</h2>
			<svg viewBox="0 0 {svgW} {svgH}" class="w-full" style="height: {svgH}px">
				<line x1={svgPad} y1={cumulY(0)} x2={svgW - svgPad} y2={cumulY(0)} stroke="var(--color-muted)" stroke-opacity="0.15" stroke-dasharray="4 4" />
				<polyline
					fill="none"
					stroke="var(--color-income)"
					stroke-width="2"
					stroke-linejoin="round"
					stroke-linecap="round"
					points={cumulData.map((d, i) => `${cumulX(i)},${cumulY(d.balance)}`).join(" ")}
				/>
				{#each cumulData as d, i}
					<circle cx={cumulX(i)} cy={cumulY(d.balance)} r="3" fill="var(--color-income)" />
					{#if showLabel(i, months.length)}
						<text x={cumulX(i)} y={svgH - 4} text-anchor="middle" fill="var(--color-muted)" font-size="10">{d.label}</text>
					{/if}
				{/each}
			</svg>
		</div>

		{#if top5.length > 0}
			<div>
				<h2 class="mb-3 text-sm font-medium text-foreground">Gastos por categoría</h2>
				<div class="flex flex-col gap-2">
					{#each top5 as c}
						{@const pct = Math.round((c.amount / totalCategoryExpense) * 100)}
						<div class="flex items-center gap-3">
							<span class="w-24 text-sm text-muted truncate">{c.name}</span>
							<div class="flex-1 h-5 rounded-full bg-surface overflow-hidden">
								<div class="h-full rounded-full bg-expense" style="width: {barPct(c.amount, maxCategory)}%"></div>
							</div>
							<span class="w-24 text-right text-xs text-muted">{formatY(c.amount)} ({pct}%)</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
