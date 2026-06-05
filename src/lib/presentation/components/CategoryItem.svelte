<script lang="ts">
	import type { Category } from '$lib/domain/entities';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	let {
		category,
		onedit,
		ondelete,
	}: {
		category: Category;
		onedit?: () => void;
		ondelete?: () => Promise<void>;
	} = $props();

	let expanded = $state(false);
	let deleting = $state(false);
	let confirmOpen = $state(false);

	const isDefault = $derived(category.isDefault);
	const hasActions = $derived(!isDefault && (onedit || ondelete));

	async function handleDelete() {
		if (!ondelete) return;
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
	class="w-full text-left cursor-pointer"
	role={hasActions ? 'button' : undefined}
	tabindex={hasActions ? 0 : undefined}
	aria-expanded={hasActions ? expanded : undefined}
	onclick={() => {
		if (hasActions) expanded = !expanded;
	}}
	onkeydown={(e) => {
		if ((e.key === 'Enter' || e.key === ' ') && hasActions) {
			e.preventDefault();
			expanded = !expanded;
		}
	}}
>
	<div class="flex items-center justify-between py-2">
		<div class="flex items-center gap-2 min-w-0">
			<span class="text-sm text-foreground truncate">{category.name}</span>
			{#if isDefault}
				<span class="text-[10px] text-muted bg-surface-raised px-1.5 py-0.5 rounded shrink-0">default</span>
			{/if}
		</div>
	</div>
	{#if expanded && hasActions}
		<div class="flex gap-2 pb-2">
			{#if onedit}
				<button
					class="flex-1 rounded-lg bg-surface-raised px-3 py-3 text-sm text-foreground transition-colors hover:opacity-80"
					onclick={(e) => {
						e.stopPropagation();
						onedit();
					}}
				>
					Editar
				</button>
			{/if}
			{#if ondelete}
				<button
					class="flex-1 rounded-lg bg-expense/10 px-3 py-3 text-sm text-expense transition-colors hover:opacity-80 disabled:opacity-50"
					onclick={(e) => {
						e.stopPropagation();
						confirmOpen = true;
					}}
					disabled={deleting}
				>
					{deleting ? 'Eliminando...' : 'Eliminar'}
				</button>

				<AlertDialog.Root bind:open={confirmOpen}>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>¿Eliminar categoría?</AlertDialog.Title>
							<AlertDialog.Description>
								Esta acción no se puede deshacer. La categoría se
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
				</AlertDialog.Root>
			{/if}
		</div>
	{/if}
</div>
