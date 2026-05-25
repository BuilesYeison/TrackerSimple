<script lang="ts">
	import { onMount } from "svelte";
	import { accountService, categoryService, recordService, workspaceReady } from "$lib/presentation/stores/workspace";
	import { groupByMonth, cumulativeBalance, topExpenseCategories, getMonthRange } from "$lib/utils/analytics-calc";
	import type { Account, Category, Record } from "$lib/domain/entities";

	let period = $state<"3m" | "6m" | "year">("6m");
	let accounts = $state<Account[]>([]);
	let categories = $state<Category[]>([]);
	let allRecords = $state<Record[]>([]);
	let loading = $state(true);

	onMount(async () => {
		await workspaceReady;
		accounts = await accountService.getActive();
		categories = await categoryService.getAll();
		await loadData();
		loading = false;
	});

	async function loadData() {
		const months = getMonthRange(period);
		const from = months[0];
		const to = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 0, 23, 59, 59);
		allRecords = await recordService.getByDateRange(from, to);
	}

	async function changePeriod(p: "3m" | "6m" | "year") {
		period = p;
		loading = true;
		await loadData();
		loading = false;
	}

	const months = $derived(getMonthRange(period));
	const monthlyData = $derived(groupByMonth(allRecords, months));
	const cumulData = $derived(cumulativeBalance(allRecords, accounts, months));
	const categoryData = $derived(topExpenseCategories(allRecords, categories));

	const maxCashFlow = $derived(Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 1));
	const minCumul = $derived(Math.min(...cumulData.map((d) => d.balance), 0));
	const maxCumul = $derived(Math.max(...cumulData.map((d) => d.balance), 1));
	const cumulRange = $derived(maxCumul - minCumul || 1);
	const maxCategory = $derived(categoryData[0]?.amount ?? 1);

	const hasMonthlyData = $derived(monthlyData.some((d) => d.income > 0 || d.expense > 0));
	const hasCumulData = $derived(cumulData.length > 0);

	function formatY(n: number): string {
		if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
		if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
		return n.toString();
	}

	function barPct(value: number, max: number): number {
		if (max === 0) return 0;
		return Math.max(2, (value / max) * 100);
	}

	function cumulY(balance: number): number {
		return 100 - ((balance - minCumul) / cumulRange) * 100;
	}
</script>

<div class="mx-auto flex max-w-md flex-col gap-6 p-4">
	<h1 class="text-2xl font-bold">Analítica</h1>

	<div class="grid grid-cols-3 gap-2 rounded-xl bg-surface p-1">
		<button
			class="rounded-xl py-2 text-sm font-medium transition-colors {period === '3m' ? 'bg-primary text-primary-foreground' : 'text-muted'}"
			onclick={() => changePeriod("3m")}
		>3 meses</button>
		<button
			class="rounded-xl py-2 text-sm font-medium transition-colors {period === '6m' ? 'bg-primary text-primary-foreground' : 'text-muted'}"
			onclick={() => changePeriod("6m")}
		>6 meses</button>
		<button
			class="rounded-xl py-2 text-sm font-medium transition-colors {period === 'year' ? 'bg-primary text-primary-foreground' : 'text-muted'}"
			onclick={() => changePeriod("year")}
		>Este año</button>
	</div>

	{#if loading}
		<div class="flex flex-col gap-4">
			<div class="h-48 animate-pulse rounded-xl bg-surface"></div>
			<div class="h-48 animate-pulse rounded-xl bg-surface"></div>
		</div>
	{:else}
		<div class="flex flex-col gap-6">
			{#if hasMonthlyData}
				<div>
					<h2 class="mb-3 text-sm font-medium text-foreground">Flujo de caja</h2>
					<div class="flex items-end gap-2 h-40">
						{#each monthlyData as d}
							<div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
								<div class="w-full flex flex-col items-center gap-px">
									<div
										class="w-full rounded-t-sm bg-income"
										style="height: {Math.max(1, (d.income / maxCashFlow) * 100)}%"
									></div>
									<div
										class="w-full rounded-t-sm bg-expense"
										style="height: {Math.max(1, (d.expense / maxCashFlow) * 100)}%"
									></div>
								</div>
								<span class="text-[10px] text-muted">{d.label}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if hasCumulData}
				<div>
					<h2 class="mb-3 text-sm font-medium text-foreground">Balance acumulado</h2>
					<div class="h-40 flex">
						<div class="flex flex-col justify-between py-0 pr-2">
							<span class="text-[10px] text-muted">{formatY(maxCumul)}</span>
							<span class="text-[10px] text-muted">{formatY(minCumul)}</span>
						</div>
						<div class="flex-1 flex items-end">
							{#each cumulData as d}
								<div class="flex-1 flex items-end h-full">
									<div
										class="w-1.5 rounded-full mx-auto {d.balance >= 0 ? 'bg-income' : 'bg-expense'}"
										style="height: {Math.max(2, cumulY(d.balance))}%"
									></div>
								</div>
							{/each}
						</div>
					</div>
					<div class="flex mt-1 ml-10">
						{#each cumulData as d}
							<span class="flex-1 text-[10px] text-muted text-center">{d.label}</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if categoryData.length > 0}
				<div>
					<h2 class="mb-3 text-sm font-medium text-foreground">Gastos por categoría</h2>
					<div class="flex flex-col gap-2">
						{#each categoryData as c}
							<div class="flex items-center gap-3">
								<span class="w-24 text-sm text-muted truncate">{c.name}</span>
								<div class="flex-1 h-5 rounded-full bg-surface overflow-hidden">
									<div
										class="h-full rounded-full bg-expense flex items-center justify-end pr-2"
										style="width: {barPct(c.amount, maxCategory)}%"
									>
										<span class="text-[10px] text-white truncate">{formatY(c.amount)}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if !hasMonthlyData && !hasCumulData}
				<div class="flex flex-col items-center gap-2 py-12 text-muted">
					<span class="text-sm">Sin datos para este período</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
