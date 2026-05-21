<script lang="ts">
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import { ArrowLeft } from "@lucide/svelte";
	import {
		accountService,
		workspaceReady,
	} from "$lib/presentation/stores/workspace";
	import AccountForm from "$lib/presentation/components/AccountForm.svelte";
	import type { Account } from "$lib/domain/entities";

	let account = $state<Account | null>(null);
	let loading = $state(true);

	onMount(async () => {
		await workspaceReady;
		account = await accountService.getById($page.params.id!);
		loading = false;
	});
</script>

<div class="mx-auto flex max-w-md flex-col gap-6">
	<header class="flex items-center gap-3">
		<button
			onclick={() => history.back()}
			class="rounded-lg p-2 text-foreground hover:bg-surface-raised transition-colors"
			aria-label="Atrás"
		>
			<ArrowLeft size={22} />
		</button>
		<h1 class="text-2xl font-bold">Editar cuenta</h1>
	</header>

	{#if loading}
		<div class="h-40 animate-pulse rounded-xl bg-surface"></div>
	{:else if !account}
		<div class="flex flex-col items-center gap-2 py-12 text-muted">
			<span class="text-4xl">🔍</span>
			<span>Cuenta no encontrada</span>
		</div>
	{:else}
		<AccountForm mode="edit" {account} />
	{/if}
</div>
