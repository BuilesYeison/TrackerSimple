<script lang="ts">
	import { goto } from "$app/navigation";
	import { toast } from "svelte-sonner";
	import { accountService, settingsService } from "$lib/presentation/stores/workspace";
	import type { Account, AccountType } from "$lib/domain/entities";

	let {
		mode,
		account = null,
	}: {
		mode: "create" | "edit";
		account?: Account | null;
	} = $props();

	let name = $state(account?.name ?? "");
	let type = $state<AccountType>(account?.type ?? "cash");
	let balance = $state(account?.balance ?? 0);
	let saving = $state(false);

	const isEdit = $derived(mode === "edit");

	async function handleSubmit() {
		if (!name.trim()) {
			toast.warning("El nombre de la cuenta es obligatorio");
			return;
		}
		if (!isEdit && balance < 0) {
			toast.warning("El balance inicial no puede ser negativo");
			return;
		}

		saving = true;
		try {
			if (isEdit && account) {
				account.name = name.trim();
				account.updatedAt = new Date();
				await accountService.update(account);
				toast.success("Cuenta actualizada");
			} else {
				const currency = await settingsService.getCurrency();
				await accountService.create({
					name: name.trim(),
					type,
					currency,
					balance,
				});
				toast.success("Cuenta creada");
			}
			setTimeout(() => goto("/accounts"), 500);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error al guardar la cuenta",
			);
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
			placeholder="Nombre de la cuenta"
			required
		/>
	</label>

	<label class="flex flex-col gap-1 text-xs font-medium text-muted">
		<span>Tipo</span>
		<select
			bind:value={type}
			disabled={isEdit}
			class="rounded-lg border border-border bg-background px-3 py-2 w-full text-sm text-foreground disabled:opacity-50"
		>
			<option value="cash">Efectivo</option>
			<option value="debit">Débito</option>
			<option value="credit">Crédito</option>
		</select>
	</label>

	{#if !isEdit}
		<label class="flex flex-col gap-1 text-xs font-medium text-muted">
			<span>Balance inicial</span>
			<input
				bind:value={balance}
				type="number"
				min="0"
				step="0.01"
				class="rounded-lg border border-border bg-background px-3 py-2 w-full text-sm text-foreground"
				placeholder="0"
			/>
		</label>
	{/if}

	<button
		type="submit"
		class="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
		disabled={saving}
	>
		{saving
			? "Guardando..."
			: isEdit
				? "Guardar cambios"
				: "Crear cuenta"}
	</button>
</form>
