<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { Plus } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import {
		accountService,
		categoryService,
		recordService,
		settingsService,
		workspaceReady,
	} from "$lib/presentation/stores/workspace";
	import { calcBalance } from "$lib/utils/balance";
	import { getMonthRange, formatMonthLabel } from "$lib/utils/date-format";
	import BalanceTotal from "$lib/presentation/components/BalanceTotal.svelte";
	import MonthSummary from "$lib/presentation/components/MonthSummary.svelte";
	import AccountCard from "$lib/presentation/components/AccountCard.svelte";
	import TopCategories from "$lib/presentation/components/TopCategories.svelte";
	import RecordItem from "$lib/presentation/components/RecordItem.svelte";
	import {
		lookupAccount as findAccount,
		lookupCategory as findCategory,
	} from "$lib/utils/lookup-helpers";
	import type { Account, Category, Record } from "$lib/domain/entities";

	let accounts = $state<Account[]>([]);
	let categories: Category[] = $state([]);
	let monthRecords: Record[] = $state([]);
	let balances = $state(new Map<string, number>());
	let currency = $state("COP");
	let recentRecords = $state<Record[]>([]);
	let loading = $state(true);
	let error = $state("");

	const today = new Date();

	onMount(async () => {
		try {
			const completed = await settingsService.isOnboardingCompleted();
			if (!completed) {
				goto("/onboarding", { replaceState: true });
				return;
			}
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
		} catch (err) {
			error =
				err instanceof Error ? err.message : "Error al cargar datos";
			toast.error(error);
		} finally {
			loading = false;
		}
	});

	const liquidBalance = $derived.by(() => {
		let sum = 0;
		for (const [id, b] of balances) {
			const acc = accounts.find((a) => a.id === id);
			if (acc && acc.type !== "credit") sum += b;
		}
		return sum;
	});

	const netBalance = $derived.by(() => {
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

	function lookupAccount(id: string) {
		return findAccount(accounts, id);
	}
	function lookupCategory(id: string) {
		return findCategory(categories, id);
	}
</script>

<div class="flex flex-col h-full max-w-md mx-auto">
	<div class="flex-1 overflow-y-auto flex flex-col gap-6">
		{#if loading}
			<div class="py-12">
				<div
					class="h-16 animate-pulse rounded-xl bg-surface mb-4"
				></div>
				<div
					class="h-20 animate-pulse rounded-xl bg-surface mb-4"
				></div>
				<div
					class="h-14 animate-pulse rounded-xl bg-surface mb-4"
				></div>
				<div
					class="h-14 animate-pulse rounded-xl bg-surface mb-4"
				></div>
				<div class="h-32 animate-pulse rounded-xl bg-surface"></div>
			</div>
		{:else if error}
			<div class="flex flex-col items-center gap-3 py-12">
				<span class="text-sm text-expense">{error}</span>
				<button
					onclick={() => window.location.reload()}
					class="rounded-lg bg-surface-raised px-4 py-2 text-sm text-foreground transition-colors hover:opacity-80"
				>
					Reintentar
				</button>
			</div>
		{:else}
			<BalanceTotal {liquidBalance} {netBalance} {currency} />

			<MonthSummary
				income={monthIncome}
				expense={monthExpense}
				period={formatMonthLabel(today)}
			/>

			{#if accounts.length > 0}
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-medium text-foreground">
					Cuentas
				</h2>
				<a
					href="/accounts"
					class="text-xs text-muted hover:text-foreground transition-colors"
				>
					Ver todas
				</a>
			</div>

			<div class="flex flex-col gap-2 -mt-3">
				{#each accounts.slice(0, 4) as account (account.id)}
					<AccountCard
						{account}
						balance={balances.get(account.id) ?? account.balance}
					/>
				{/each}
			</div>
			{/if}

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
