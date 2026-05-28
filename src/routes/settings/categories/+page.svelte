<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import {
		categoryService,
		recordService,
		workspaceReady,
	} from '$lib/presentation/stores/workspace';
	import CategoryItem from '$lib/presentation/components/CategoryItem.svelte';
	import CategoryForm from '$lib/presentation/components/CategoryForm.svelte';
	import type { Category, CategoryType } from '$lib/domain/entities';

	let categories = $state<Category[]>([]);
	let loading = $state(true);
	let showForm = $state<'create' | 'edit' | null>(null);
	let editTarget = $state<Category | null>(null);

	onMount(async () => {
		await workspaceReady;
		await loadCategories();
	});

	async function loadCategories() {
		loading = true;
		categories = await categoryService.getAll();
		loading = false;
	}

	const expenseCategories = $derived(
		categories.filter((c) => c.type === 'expense'),
	);
	const incomeCategories = $derived(
		categories.filter((c) => c.type === 'income'),
	);

	function handleCreate() {
		showForm = 'create';
		editTarget = null;
	}

	function handleEdit(category: Category) {
		editTarget = category;
		showForm = 'edit';
	}

	function handleCancelForm() {
		showForm = null;
		editTarget = null;
	}

	async function handleFormSuccess() {
		showForm = null;
		editTarget = null;
		await loadCategories();
	}

	async function handleDelete(category: Category) {
		try {
			const records = await recordService.getByCategory(category.id);
			if (records.length > 0) {
				toast.error(
					`Esta categoría tiene ${records.length} registros, no se puede eliminar`,
				);
				return;
			}
			await categoryService.delete(category.id);
			toast.success('Categoría eliminada');
			await loadCategories();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Error al eliminar',
			);
		}
	}
</script>

<div class="flex flex-col h-full max-w-md mx-auto">
	<!-- Título y navegación -->
	<div class="flex items-center gap-3 mb-4 mt-1">
		<button
			onclick={() => goto('/settings')}
			class="p-1 -ml-1 rounded-lg text-muted hover:text-foreground transition-colors"
		>
			<ArrowLeft size={20} />
		</button>
		<h1 class="text-2xl font-bold">Categorías</h1>
	</div>

	<div class="flex-1 overflow-y-auto flex flex-col gap-4 records-list">
		{#if showForm}
			<div class="rounded-xl border border-border p-4">
				<CategoryForm
					mode={showForm}
					category={editTarget}
					onsuccess={handleFormSuccess}
					oncancel={handleCancelForm}
				/>
			</div>
		{/if}

		{#if loading}
			<div class="flex flex-col gap-2">
				{#each Array(6) as _}
					<div class="h-10 animate-pulse rounded-lg bg-surface"></div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				<div class="flex flex-col gap-1 rounded-xl border border-border p-4">
					<span class="text-xs font-medium text-expense">GASTOS</span>
					{#each expenseCategories as c (c.id)}
						<CategoryItem
							category={c}
							onedit={c.isDefault ? undefined : () => handleEdit(c)}
							ondelete={c.isDefault ? undefined : () => handleDelete(c)}
						/>
					{/each}
					{#if expenseCategories.length === 0}
						<div class="text-xs text-muted py-2">Sin categorías de gasto</div>
					{/if}
				</div>

				<div class="flex flex-col gap-1 rounded-xl border border-border p-4">
					<span class="text-xs font-medium text-income">INGRESOS</span>
					{#each incomeCategories as c (c.id)}
						<CategoryItem
							category={c}
							onedit={c.isDefault ? undefined : () => handleEdit(c)}
							ondelete={c.isDefault ? undefined : () => handleDelete(c)}
						/>
					{/each}
					{#if incomeCategories.length === 0}
						<div class="text-xs text-muted py-2">Sin categorías de ingreso</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- FAB -->
	<div
		class="flex-shrink-0 px-4 py-3"
		style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
	>
		<button
			onclick={handleCreate}
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
		>
			<Plus size={18} />
			Nueva categoría
		</button>
	</div>
</div>
