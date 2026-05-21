<script lang="ts">
	import type { Account } from "$lib/domain/entities";

	let {
		account,
		balance,
	}: {
		account: Account;
		balance: number;
	} = $props();

	const barColor = $derived(
		account.type === "cash"
			? "bg-cash"
			: account.type === "debit"
				? "bg-debit"
				: "bg-credit",
	);

	const typeLabel = $derived(
		account.type === "cash"
			? "Efectivo"
			: account.type === "debit"
				? "Débito"
				: "Crédito",
	);

	const balanceSign = $derived(balance >= 0 ? "+" : "");
	const balanceColor = $derived(balance >= 0 ? "text-income" : "text-expense");
	const formattedBalance = $derived(
		`${balanceSign}$${Math.abs(balance).toLocaleString("es")}`,
	);
</script>

<div class="flex rounded-xl bg-surface overflow-hidden">
	<div class="w-[3px] shrink-0 {barColor}"></div>
	<div class="flex-1 px-4 py-3 flex items-center justify-between gap-3">
		<div class="min-w-0">
			<div class="text-sm font-medium text-foreground truncate">
				{account.name}
			</div>
			<div class="text-xs text-muted">{typeLabel}</div>
		</div>
		<div class="text-sm font-semibold shrink-0 {balanceColor}">
			{formattedBalance}
		</div>
	</div>
</div>
