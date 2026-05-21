<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { Plus } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import {
		accountService,
		recordService,
		workspaceReady,
	} from "$lib/presentation/stores/workspace";
	import AccountCard from "$lib/presentation/components/AccountCard.svelte";
	import type { Account } from "$lib/domain/entities";

	let accounts = $state<Account[]>([]);
	let balances = $state(new Map<string, number>());
	let loading = $state(true);

	onMount(async () => {
		await workspaceReady;
		const activeAccounts = await accountService.getActive();
		const balanceMap = new Map<string, number>();
		const promises = activeAccounts.map(async (acc) => {
			const b = await calcBalance(acc);
			balanceMap.set(acc.id, b);
		});
		await Promise.all(promises);
		accounts = activeAccounts;
		balances = balanceMap;
		loading = false;
	});

	async function calcBalance(account: Account): Promise<number> {
		const records = await recordService.getByAccount(account.id);
		let balance = account.balance;
		for (const r of records) {
			if (r.type === "income" && r.accountId === account.id)
				balance += r.amount;
			if (r.type === "expense" && r.accountId === account.id)
				balance -= r.amount;
			if (r.type === "transfer" && r.accountId === account.id)
				balance -= r.amount;
			if (r.type === "transfer" && r.toAccountId === account.id)
				balance += r.amount;
		}
		return balance;
	}

	function handleEdit(account: Account) {
		goto(`/accounts/${account.id}/edit`);
	}

	async function handleDelete(account: Account) {
		const records = await recordService.getByAccount(account.id);
		if (records.length > 0) {
			toast.error(
				"No se puede eliminar: la cuenta tiene registros asociados",
			);
			return;
		}
		try {
			await accountService.delete(account.id);
			accounts = accounts.filter((a) => a.id !== account.id);
			balances.delete(account.id);
			balances = new Map(balances);
			toast.success("Cuenta eliminada");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error al eliminar",
			);
		}
	}
</script>

<div class="flex flex-col h-full max-w-md mx-auto">
	<div class="flex-1 overflow-y-auto flex flex-col gap-4 records-list mt-3">
		<h1 class="text-2xl font-bold">Cuentas</h1>

		{#if loading}
			<div class="flex flex-col gap-2">
				{#each Array(3) as _}
					<div class="h-16 animate-pulse rounded-xl bg-surface"></div>
				{/each}
			</div>
		{:else if accounts.length === 0}
			<div class="flex flex-col items-center gap-2 py-12 text-muted">
				<span class="text-4xl">💳</span>
				<span>Sin cuentas creadas</span>
			</div>
		{:else}
			<div class="flex flex-col gap-2">
				{#each accounts as account (account.id)}
					<AccountCard
						{account}
						balance={balances.get(account.id) ?? account.balance}
						onedit={() => handleEdit(account)}
						ondelete={() => handleDelete(account)}
					/>
				{/each}
			</div>
		{/if}
	</div>

	<!-- botón fijo al fondo -->
	<div
		class="flex-shrink-0 px-4 py-3"
		style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
	>
		<button
			onclick={() => goto("/accounts/new")}
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
		>
			<Plus size={18} />
			Crear cuenta
		</button>
	</div>
</div>
