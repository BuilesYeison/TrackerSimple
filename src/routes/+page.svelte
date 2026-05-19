<script lang="ts">
	import { onMount } from 'svelte';
	import { initWorkspace, isReady, accountService, categoryService, recordService } from '$lib/presentation/stores/workspace';

	let loading = $state(true);
	let stats = $state({ accounts: 0, categories: 0, records: 0 });

	onMount(async () => {
		await initWorkspace();
		const [accounts, categories, records] = await Promise.all([
			accountService.getAll(),
			categoryService.getAll(),
			recordService.getAll()
		]);
		stats = {
			accounts: accounts.length,
			categories: categories.length,
			records: records.length
		};
		loading = false;
	});
</script>

<div class="container mx-auto flex flex-col items-center gap-8 p-8">
	<div class="flex flex-col items-center gap-2">
		<h1 class="h1">PersonalFinAppV2</h1>
		<p class="text-surface-600-400 text-sm uppercase tracking-widest">MVP — Gestión de finanzas personales</p>
	</div>

	{#if loading}
		<div class="flex flex-col items-center gap-4">
			<div class="placeholder-content w-64 h-8"></div>
			<div class="placeholder-content w-48 h-4"></div>
		</div>
	{:else}
		<div class="card p-6 w-full max-w-md">
			<div class="grid grid-cols-3 gap-4 text-center">
				<div>
					<p class="h2">{stats.accounts}</p>
					<p class="text-xs text-surface-600-400">Cuentas</p>
				</div>
				<div>
					<p class="h2">{stats.categories}</p>
					<p class="text-xs text-surface-600-400">Categorías</p>
				</div>
				<div>
					<p class="h2">{stats.records}</p>
					<p class="text-xs text-surface-600-400">Movimientos</p>
				</div>
			</div>
		</div>

		<p class="text-success-500 text-sm">Base de datos inicializada correctamente</p>
	{/if}
</div>
