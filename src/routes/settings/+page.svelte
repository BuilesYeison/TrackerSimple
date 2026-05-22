<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import {
		settingsService,
		workspaceReady,
	} from "$lib/presentation/stores/workspace";
	import type { Currency } from "$lib/domain/entities";

	let currency = $state<Currency>("COP");
	let saving = $state(false);

	onMount(async () => {
		await workspaceReady;
		currency = await settingsService.getCurrency();
	});

	async function handleCurrencyChange() {
		saving = true;
		try {
			await settingsService.setCurrency(currency);
			toast.success("Moneda actualizada");
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Error al guardar configuración",
			);
		} finally {
			saving = false;
		}
	}
</script>

<div class="mx-auto flex max-w-md flex-col gap-4">
	<h1 class="text-2xl font-bold">Ajustes</h1>

	<div class="flex flex-col gap-1 rounded-xl border border-border p-4">
		<span class="text-xs font-medium text-muted">Moneda principal</span>
		<select
			bind:value={currency}
			onchange={handleCurrencyChange}
			disabled={saving}
			class="rounded-lg border border-border bg-background px-3 py-2 w-full text-sm text-foreground disabled:opacity-50"
		>
			<option value="COP">COP — Peso colombiano</option>
			<option value="USD">USD — Dólar estadounidense</option>
			<option value="EUR">EUR — Euro</option>
			<option value="ARS">ARS — Peso argentino</option>
			<option value="MXN">MXN — Peso mexicano</option>
			<option value="CLP">CLP — Peso chileno</option>
			<option value="PEN">PEN — Sol peruano</option>
		</select>
	</div>

	<div
		class="flex items-center justify-between rounded-xl border border-border p-4"
	>
		<span>Acerca de PersonalFinApp</span>
		<span class="text-xs text-muted">v0.0.1</span>
	</div>
</div>
