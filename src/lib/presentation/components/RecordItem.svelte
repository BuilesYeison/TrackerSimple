<script lang="ts">
	import type { Record } from "$lib/domain/entities";
	import { getCategoryEmoji } from "$lib/category-icons";

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

	const emoji = $derived(
		record.type === "transfer" ? "🔄" : getCategoryEmoji(categoryName),
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
			? "text-[#f87171]"
			: record.type === "transfer"
				? "text-[#a78bfa]"
				: "text-[#4ade80]",
	);
	const formattedAmount = $derived(
		`${sign}$${record.amount.toLocaleString("es")}`,
	);
</script>

<div class="flex items-center gap-3 py-2">
	<span class="text-xl">{emoji}</span>
	<div class="flex-1 min-w-0">
		<div class="text-sm font-medium truncate">{displayCategory}</div>
		<div class="text-xs text-[#444] truncate">
			{displayAccount}
		</div>
	</div>
	<span class="text-sm font-semibold shrink-0 {colorClass}"
		>{formattedAmount}</span
	>
</div>
