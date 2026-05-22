<script lang="ts">
	import type { Record } from "$lib/domain/entities";
	import { getCategoryIcon } from "$lib/category-icons";
	import { ArrowLeftRight } from "@lucide/svelte";

	let {
		record,
		accountName,
		categoryName,
		toAccountName,
	}: {
		record: Record;
		accountName: string;
		categoryName: string;
		toAccountName?: string;
	} = $props();

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
</script>

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
