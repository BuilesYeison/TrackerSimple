<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { categoryService } from '$lib/presentation/stores/workspace';
	import type { Category, CategoryType } from '$lib/domain/entities';

	let {
		mode,
		category = null,
		onsuccess = undefined,
		oncancel = undefined,
	}: {
		mode: 'create' | 'edit';
		category?: Category | null;
		onsuccess?: () => void;
		oncancel?: () => void;
	} = $props();

	let name = $state(category?.name ?? '');
	let type = $state<CategoryType>(category?.type ?? 'expense');
	let saving = $state(false);

	const isEdit = $derived(mode === 'edit');

	async function handleSubmit() {
		if (!name.trim()) {
			toast.warning('El nombre de la categoría es obligatorio');
			return;
		}

		saving = true;
		try {
			if (isEdit && category) {
				category.name = name.trim();
				await categoryService.update(category);
				toast.success('Categoría actualizada');
			} else {
				await categoryService.create({ name: name.trim(), type });
				toast.success('Categoría creada');
			}
			onsuccess?.();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Error al guardar');
		} finally {
			saving = false;
		}
	}
</script>

<form
	class="flex flex-col gap-4"
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
>
	<label class="flex flex-col gap-1 text-xs font-medium text-muted">
		<span>Nombre</span>
		<input
			bind:value={name}
			type="text"
			class="rounded-lg border border-border bg-background px-3 py-2 w-full text-sm text-foreground"
			placeholder="Nombre de la categoría"
			required
		/>
	</label>

	<label class="flex flex-col gap-1 text-xs font-medium text-muted">
		<span>Tipo</span>
		<div class="flex rounded-lg border border-border overflow-hidden">
			<button
				type="button"
				onclick={() => (type = 'expense')}
				disabled={isEdit || saving}
				class="flex-1 px-3 py-2 text-sm transition-colors {type === 'expense' ? 'bg-expense text-background font-medium' : 'bg-background text-muted'} disabled:opacity-50"
			>
				Gasto
			</button>
			<button
				type="button"
				onclick={() => (type = 'income')}
				disabled={isEdit || saving}
				class="flex-1 px-3 py-2 text-sm transition-colors {type === 'income' ? 'bg-income text-background font-medium' : 'bg-background text-muted'} disabled:opacity-50"
			>
				Ingreso
			</button>
		</div>
	</label>

	<div class="flex gap-2">
		{#if oncancel}
			<button
				type="button"
				class="flex-1 rounded-xl bg-surface-raised px-4 py-3 text-sm text-muted transition-colors hover:opacity-80"
				onclick={oncancel}
				disabled={saving}
			>
				Cancelar
			</button>
		{/if}
		<button
			type="submit"
			class="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
			disabled={saving}
		>
			{saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
		</button>
	</div>
</form>
