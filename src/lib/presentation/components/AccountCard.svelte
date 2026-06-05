<script lang="ts">
	import type { Account } from "$lib/domain/entities";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

	let {
		account,
		balance,
		onedit,
		ondelete,
	}: {
		account: Account;
		balance: number;
		onedit?: () => void;
		ondelete?: () => Promise<void>;
	} = $props();

	let expanded = $state(false);
	let deleting = $state(false);
	let confirmOpen = $state(false);

	const hasActions = $derived(!!onedit || !!ondelete);

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

	const balanceSign = $derived(balance >= 0 ? "+" : "-");
	const balanceColor = $derived(
		balance >= 0 ? "text-income" : "text-expense",
	);
	const formattedBalance = $derived(
		`${balanceSign}$${Math.abs(balance).toLocaleString("es")}`,
	);

	async function handleDelete() {
		deleting = true;
		try {
			await ondelete();
		} finally {
			deleting = false;
			expanded = false;
			confirmOpen = false;
		}
	}
</script>

<div
	class="rounded-xl bg-surface overflow-hidden {hasActions ? 'cursor-pointer' : ''}"
	role={hasActions ? 'button' : undefined}
	tabindex={hasActions ? 0 : undefined}
	aria-expanded={hasActions ? expanded : undefined}
	onclick={hasActions ? () => (expanded = !expanded) : undefined}
	onkeydown={hasActions
		? (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					expanded = !expanded;
				}
			}
		: undefined}
>
	<div class="flex">
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
	{#if hasActions && expanded}
		<div class="flex gap-2 px-4 pb-3">
			<button
				class="flex-1 rounded-lg bg-surface-raised px-3 py-3 text-sm text-foreground transition-colors hover:opacity-80"
				onclick={(e) => {
					e.stopPropagation();
					onedit();
				}}
			>
				Editar
			</button>
			<button
				class="flex-1 rounded-lg bg-expense/10 px-3 py-3 text-sm text-expense transition-colors hover:opacity-80 disabled:opacity-50 w-full"
				disabled={deleting}
				onclick={(e) => {
					e.stopPropagation();
					confirmOpen = true;
				}}
			>
				{deleting ? "Eliminando..." : "Eliminar"}
			</button>

			<AlertDialog.Root bind:open={confirmOpen}>
				<AlertDialog.Portal>
					<AlertDialog.Overlay />
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title
								>¿Eliminar cuenta?</AlertDialog.Title
							>
							<AlertDialog.Description>
								Esta acción no se puede deshacer. La cuenta se
								eliminará permanentemente.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
							<AlertDialog.Action onclick={handleDelete}>
								Eliminar
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Portal>
			</AlertDialog.Root>
		</div>
	{/if}
</div>
