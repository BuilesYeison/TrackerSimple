<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { Plus } from "@lucide/svelte";
	import {
		accountService,
		categoryService,
		recordService,
		settingsService,
		workspaceReady,
	} from "$lib/presentation/stores/workspace";
	import { calcBalance } from "$lib/utils/balance";
	import { getMonthRange, formatMonthLabel } from "$lib/date-format";
	import BalanceTotal from "$lib/presentation/components/BalanceTotal.svelte";
	import MonthSummary from "$lib/presentation/components/MonthSummary.svelte";
	import TopCategories from "$lib/presentation/components/TopCategories.svelte";
	import RecordItem from "$lib/presentation/components/RecordItem.svelte";
	import type { Account } from "$lib/domain/entities";
	import type { Category } from "$lib/domain/entities";
	import type { Record } from "$lib/domain/entities";

	let accounts = $state<Account[]>([]);
	let categories: Category[] = $state([]);
	let monthRecords: Record[] = $state([]);
	let balances = $state(new Map<string, number>());
	let currency = $state("COP");
	let recentRecords = $state<Record[]>([]);
	let loading = $state(true);

	const today = new Date();

	onMount(async () => {
		await workspaceReady;
		accounts = await accountService.getActive();
		categories = await categoryService.getAll();
		currency = await settingsService.getCurrency();

		const { from, to } = getMonthRange(
			today.getFullYear(),
			today.getMonth(),
		);
		monthRecords = await recordService.getByDateRange(from, to);

		const balanceMap = new Map<string, number>();
		for (const acc of accounts) {
			balanceMap.set(acc.id, await calcBalance(acc, recordService));
		}
		balances = balanceMap;
		recentRecords = await recordService.getRecent(5);
		loading = false;
	});

	const totalBalance = $derived.by(() => {
		let sum = 0;
		for (const [_, b] of balances) sum += b;
		return sum;
	});

	const monthIncome = $derived(
		monthRecords
			.filter((r) => r.type === "income")
			.reduce((s, r) => s + r.amount, 0),
	);

	const monthExpense = $derived(
		monthRecords
			.filter((r) => r.type === "expense")
			.reduce((s, r) => s + r.amount, 0),
	);

	const topCategories = $derived.by(() => {
		const map = new Map<string, number>();
		for (const r of monthRecords) {
			if (r.type === "expense") {
				map.set(r.categoryId, (map.get(r.categoryId) ?? 0) + r.amount);
			}
		}
		const max = Math.max(...map.values(), 1);
		return Array.from(map.entries())
			.map(([id, amt]) => ({
				name: lookupCategory(id),
				amount: amt,
				maxAmount: max,
			}))
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 3);
	});

	function lookupAccount(id: string): string {
		return accounts.find((a) => a.id === id)?.name ?? "—";
	}

	function lookupCategory(id: string): string {
		return categories.find((c) => c.id === id)?.name ?? "—";
	}
</script>

<div class="flex flex-col h-full max-w-md mx-auto">
	<div class="flex-1 overflow-y-auto flex flex-col gap-6">
		<BalanceTotal balance={totalBalance} {currency} />

		<MonthSummary
			income={monthIncome}
			expense={monthExpense}
			period={formatMonthLabel(today)}
		/>

		<TopCategories categories={topCategories} />

		<div class="flex items-center justify-between">
			<h2 class="text-sm font-medium text-foreground">
				Últimos movimientos
			</h2>
			<a
				href="/records"
				class="text-xs text-muted hover:text-foreground transition-colors"
			>
				Ver todos
			</a>
		</div>

		{#if recentRecords.length > 0}
			<div class="divide-y divide-border -mt-3">
				{#each recentRecords as record (record.id)}
					<RecordItem
						{record}
						accountName={lookupAccount(record.accountId)}
						categoryName={record.type === "transfer"
							? ""
							: lookupCategory(record.categoryId)}
						toAccountName={record.toAccountId
							? lookupAccount(record.toAccountId)
							: undefined}
					/>
				{/each}
			</div>
		{:else}
			<div class="py-8 text-center text-muted text-sm">
				Sin movimientos este mes
			</div>
		{/if}
	</div>

	<div
		class="flex-shrink-0 px-4 py-3"
		style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
	>
		<button
			onclick={() => goto("/records/new")}
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
		>
			<Plus size={18} />
			Nuevo registro
		</button>
	</div>
</div>
