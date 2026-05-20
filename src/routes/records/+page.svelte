<script lang="ts">
	import { onMount } from "svelte";
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";
	import {
		accountService,
		categoryService,
		recordService,
		workspaceReady,
	} from "$lib/presentation/stores/workspace";
	import {
		formatGroupDate,
		getMonthRange,
		formatMonthLabel,
	} from "$lib/utils/date-format";
	import RecordItem from "$lib/presentation/components/RecordItem.svelte";
	import type { Account } from "$lib/domain/entities";
	import type { Category } from "$lib/domain/entities";
	import type { Record } from "$lib/domain/entities";

	let filterType = $state<"all" | "expense" | "income" | "transfer">("all");
	let currentDate = $state(new Date());
	let accounts: Account[] = $state([]);
	let categories: Category[] = $state([]);
	let cache = $state(new Map<string, Record[]>());

	onMount(async () => {
		await workspaceReady;
		accounts = await accountService.getAll();
		categories = await categoryService.getAll();
		await loadMonthRange(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			3,
		);
	});

	async function loadMonthRange(year: number, month: number, count: number) {
		for (let i = 0; i < count; i++) {
			const m = month - i;
			const y = m < 0 ? year - 1 : year;
			const adj = m < 0 ? m + 12 : m;
			const key = `${y}-${String(adj + 1).padStart(2, "0")}`;
			if (cache.has(key)) continue;
			const { from, to } = getMonthRange(y, adj);
			const records = await recordService.getByDateRange(from, to);
			cache.set(key, records);
		}
		cache = new Map(cache);
	}

	async function navigateMonth(delta: number) {
		const newDate = new Date(currentDate);
		newDate.setMonth(newDate.getMonth() + delta);
		if (newDate > new Date()) return;
		currentDate = newDate;
		const key = monthKey;
		if (!cache.has(key)) {
			await loadMonthRange(newDate.getFullYear(), newDate.getMonth(), 1);
		}
	}

	function lookupAccount(id: string): string {
		return accounts.find((a) => a.id === id)?.name ?? "—";
	}

	function lookupCategory(id: string): string {
		return categories.find((c) => c.id === id)?.name ?? "—";
	}

	const monthKey = $derived(
		`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`,
	);
	const monthLabel = $derived(formatMonthLabel(currentDate));
	const canGoForward = $derived(
		currentDate.getFullYear() < new Date().getFullYear() ||
			currentDate.getMonth() < new Date().getMonth(),
	);

	const groupedRecords = $derived.by(() => {
		const records = cache.get(monthKey) ?? [];
		const filtered =
			filterType === "all"
				? records
				: records.filter((r) => r.type === filterType);

		const groups = new Map<
			string,
			{ records: Record[]; subtotal: number }
		>();
		for (const r of filtered) {
			const key =
				r.date instanceof Date
					? r.date.toISOString().split("T")[0]
					: "";
			if (!groups.has(key)) groups.set(key, { records: [], subtotal: 0 });
			const g = groups.get(key)!;
			g.records.push(r);
			g.subtotal += r.type === "expense" ? -r.amount : r.amount;
		}

		return Array.from(groups.entries())
			.sort((a, b) => b[0].localeCompare(a[0]))
			.map(([dateKey, group]) => ({ dateKey, ...group }));
	});

	function subtotalColor(subtotal: number): string {
		if (subtotal < 0) return "text-error-500";
		if (subtotal > 0) return "text-success-700";
		return "text-surface-500-400";
	}

	function subtotalSign(subtotal: number): string {
		return subtotal >= 0 ? "+" : "";
	}
</script>

<div class="mx-auto flex max-w-md flex-col gap-4">
	<div class="flex items-center justify-between">
		<button
			onclick={() => navigateMonth(-1)}
			class="btn btn-icon btn-ghost-surface btn-sm"
		>
			<ChevronLeft size={20} />
		</button>
		<span class="text-lg font-semibold capitalize">{monthLabel}</span>
		{#if canGoForward}
			<button
				onclick={() => navigateMonth(1)}
				class="btn btn-icon btn-ghost-surface btn-sm"
			>
				<ChevronRight size={20} />
			</button>
		{:else}
			<div class="w-8" />
		{/if}
	</div>

	<div class="grid grid-cols-4 gap-2 rounded-2xl bg-surface-100-900 p-1">
		<button
			class="rounded-xl py-2 text-xs font-medium transition-colors {filterType ===
			'all'
				? 'bg-surface-500 text-white'
				: 'text-surface-700-300'}"
			onclick={() => (filterType = "all")}>Todos</button
		>
		<button
			class="rounded-xl py-2 text-xs font-medium transition-colors {filterType ===
			'expense'
				? 'bg-error-500 text-white'
				: 'text-surface-700-300'}"
			onclick={() => (filterType = "expense")}>Gasto</button
		>
		<button
			class="rounded-xl py-2 text-xs font-medium transition-colors {filterType ===
			'income'
				? 'bg-success-700 text-white'
				: 'text-surface-700-300'}"
			onclick={() => (filterType = "income")}>Ingreso</button
		>
		<button
			class="rounded-xl py-2 text-xs font-medium transition-colors {filterType ===
			'transfer'
				? 'bg-secondary-500 text-white'
				: 'text-surface-700-300'}"
			onclick={() => (filterType = "transfer")}>Transferencia</button
		>
	</div>

	{#if groupedRecords.length === 0}
		<div
			class="flex flex-col items-center gap-2 py-12 text-surface-500-400"
		>
			<span class="text-4xl">📭</span>
			<span>Sin registros este mes</span>
		</div>
	{:else}
		{#each groupedRecords as { dateKey, records, subtotal }}
			<div>
				<div class="mb-1 text-xs font-medium text-surface-500-400">
					{formatGroupDate(dateKey)}
				</div>
				<div class="divide-y divide-surface-100-900">
					{#each records as record (record.id)}
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
				<div
					class="mt-1 text-right text-xs font-medium {subtotalColor(
						subtotal,
					)}"
				>
					Subtotal día: {subtotalSign(subtotal)}${Math.abs(
						subtotal,
					).toLocaleString("es")}
				</div>
			</div>
		{/each}
	{/if}
</div>
