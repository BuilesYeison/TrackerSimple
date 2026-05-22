<script lang="ts">
	import type { Record } from "$lib/domain/entities";
	import { getCategoryIcon } from "$lib/category-icons";
	import { ArrowLeftRight } from "@lucide/svelte";

	let {
		record,
		accountName,
		categoryName,
		toAccountName,
		onedit,
		ondelete,
	}: {
		record: Record;
		accountName: string;
		categoryName: string;
		toAccountName?: string;
		onedit?: () => void;
		ondelete?: () => Promise<void>;
	} = $props();

	let expanded = $state(false);
	let deleting = $state(false);

	const Icon = $derived(
		record.type === "transfer"
			? ArrowLeftRight
			: getCategoryIcon(categoryName),
	);
	const displayCategory = $derived(
		record.type === "transfer" ? "Transferencia" : categoryName,
	);
	const displayAccount = $derived(
		record.type === "transfer" && toAccountName
			? `${accountName} → ${toAccountName}`
			: accountName,
	);
	const sign = $derived(record.type === "expense" ? "-" : "+");
	const colorClass = $derived(
		record.type === "expense"
			? "text-expense"
			: record.type === "transfer"
				? "text-transfer"
				: "text-income",
	);
	const formattedAmount = $derived(
		`${sign}$${record.amount.toLocaleString("es")}`,
	);

	const hasActions = $derived(onedit || ondelete);

	async function handleDelete(e: Event) {
		e.stopPropagation();
		if (!ondelete) return;
		deleting = true;
		try {
			await ondelete();
		} finally {
			deleting = false;
			expanded = false;
		}
	}
</script>

<div
	class="cursor-pointer"
	onclick={() => {
		if (hasActions) expanded = !expanded;
	}}
>
	<div class="flex items-center gap-3 py-2">
		<Icon class="size-5 text-muted shrink-0" />
		<div class="flex-1 min-w-0">
			<div class="text-sm font-medium truncate">{displayCategory}</div>
			<div class="text-xs text-muted truncate">
				{displayAccount}
			</div>
		</div>
		<span class="text-sm font-semibold shrink-0 {colorClass}"
			>{formattedAmount}</span
		>
	</div>
	{#if expanded && hasActions}
		<div class="flex gap-2 pb-2">
			{#if onedit}
				<button
					class="flex-1 rounded-lg bg-surface-raised px-3 py-2 text-sm text-foreground transition-colors hover:opacity-80"
					onclick={(e) => { e.stopPropagation(); onedit(); }}
				>
					Editar
				</button>
			{/if}
			{#if ondelete}
				<button
					class="flex-1 rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense transition-colors hover:opacity-80 disabled:opacity-50"
					onclick={handleDelete}
					disabled={deleting}
				>
					{deleting ? "Eliminando..." : "Eliminar"}
				</button>
			{/if}
		</div>
	{/if}
</div>
