<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { Download, Upload } from "@lucide/svelte";
	import {
		settingsService,
		workspaceReady,
		snapshotService,
	} from "$lib/presentation/stores/workspace";
	import type { Currency } from "$lib/domain/entities";

	let currency = $state<Currency>("COP");
	let saving = $state(false);
	let exporting = $state(false);
	let importing = $state(false);

	onMount(async () => {
		await workspaceReady;
		currency = await settingsService.getCurrency();
	});

	async function handleCurrencyChange() {
		saving = true;
		try {
			await settingsService.setCurrency(currency);
			toast.success("Moneda actualizada");
			snapshotService.createSnapshot();
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

	async function handleExport() {
		exporting = true;
		try {
			await snapshotService.exportToZip();
			toast.success("Backup exportado");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error al exportar",
			);
		} finally {
			exporting = false;
		}
	}

	async function handleImport(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		importing = true;
		try {
			await snapshotService.importFromFile(file);
			toast.success("Datos importados correctamente");
			setTimeout(() => window.location.reload(), 800);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error al importar",
			);
		} finally {
			importing = false;
			input.value = "";
		}
	}
</script>

<div class="mx-auto flex max-w-md flex-col gap-4">
	<h1 class="text-2xl font-bold">Ajustes</h1>

	<div class="flex flex-col gap-1 rounded-xl border border-border">
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

	<div class="flex flex-col gap-2 rounded-xl border border-border">
		<span class="text-xs font-medium text-muted">Datos</span>
		<button
			onclick={handleExport}
			disabled={exporting}
			class="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 text-sm text-foreground transition-colors hover:opacity-80 disabled:opacity-50"
		>
			<Download size={16} />
			{exporting ? "Exportando..." : "Exportar datos"}
		</button>
		<label
			class="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 text-sm text-foreground transition-colors hover:opacity-80 disabled:opacity-50 cursor-pointer"
		>
			<Upload size={16} />
			{importing ? "Importando..." : "Importar datos"}
			<input
				type="file"
				accept=".zip"
				class="hidden"
				onchange={handleImport}
				disabled={importing}
			/>
		</label>
	</div>

	<div
		class="flex items-center justify-between rounded-xl border border-border"
	>
		<span>Acerca de PersonalFinApp</span>
		<span class="text-xs text-muted">v0.0.1</span>
	</div>
</div>
