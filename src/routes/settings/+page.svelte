<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { toast } from "svelte-sonner";
	import { Download, Upload, Folder, Tags } from "@lucide/svelte";
	import { Share } from "@capacitor/share";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import {
		settingsService,
		workspaceReady,
		exportService,
		importService,
	} from "$lib/presentation/stores/workspace";
	import { closeDatabase } from "$lib/infrastructure/db/sqlite";
	import type { Currency } from "$lib/domain/entities";
	import { Capacitor } from "@capacitor/core";
	import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
	import SafSyncSection from "$lib/presentation/components/SafSyncSection.svelte";

	let currency = $state<Currency>("COP");
	let saving = $state(false);
	let exporting = $state(false);
	let importing = $state(false);
	let lastBackupAt = $state<string | null>(null);
	let confirmOpen = $state(false);
	let pendingFile = $state<File | null>(null);

	onMount(async () => {
		await workspaceReady;
		currency = await settingsService.getCurrency();
		const settings = await settingsService.getSettings();
		lastBackupAt = settings?.lastBackupAt ?? null;
	});

	const daysSinceBackup = $derived(
		lastBackupAt
			? Math.floor(
					(Date.now() - new Date(lastBackupAt).getTime()) /
						(1000 * 60 * 60 * 24),
				)
			: null,
	);

	function formatBackupDate(iso: string): string {
		const date = new Date(iso);
		const now = new Date();
		const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
		if (diffMin < 1) return "ahora";
		if (diffMin < 60) return `hace ${diffMin} min`;
		const diffHr = Math.floor(diffMin / 60);
		if (diffHr < 24) return `hace ${diffHr}h`;
		const diffDay = Math.floor(diffHr / 24);
		if (diffDay === 1) return "ayer";
		if (diffDay < 7) return `hace ${diffDay} días`;
		return date.toLocaleDateString("es", {
			day: "numeric",
			month: "short",
		});
	}

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

	async function handleExport() {
		exporting = true;
		try {
			const json = await exportService.createBackup();

			const now = new Date().toISOString();
			const current = await settingsService.getSettings();
			if (current) {
				current.lastBackupAt = now;
				await settingsService.updateSettings(current);
			}
			lastBackupAt = now;

			const filename = `finapp-backup-${new Date().toISOString().split("T")[0]}.json`;

			if (Capacitor.isNativePlatform()) {
				await Filesystem.writeFile({
					path: filename,
					data: json,
					directory: Directory.Cache,
					encoding: Encoding.UTF8,
				});

				const { uri } = await Filesystem.getUri({
					path: filename,
					directory: Directory.Cache,
				});

				await Share.share({
					title: "Backup FinApp",
					url: uri,
					dialogTitle: "Guardar backup",
				});
			} else {
				const blob = new Blob([json], { type: "application/json" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}

			toast.success("Backup exportado");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error al exportar",
			);
		} finally {
			exporting = false;
		}
	}

	function handleFileSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		pendingFile = file;
		confirmOpen = true;
		input.value = "";
	}

	async function handleImportConfirmed() {
		if (!pendingFile) return;
		importing = true;
		try {
			await importService.importFromFile(pendingFile);
			const current = await settingsService.getSettings();
			if (current) {
				current.syncFileName = pendingFile.name;
				current.safUri = undefined;
				current.lastSyncAt = undefined;
				await settingsService.updateSettings(current);
			}
			toast.success("Datos importados correctamente");
			await closeDatabase();
			setTimeout(() => window.location.reload(), 800);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error al importar",
			);
		} finally {
			importing = false;
			pendingFile = null;
			confirmOpen = false;
		}
	}
</script>

<div class="mx-auto flex max-w-md flex-col gap-4 p-4">
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

	<div class="flex flex-col gap-3 rounded-xl border border-border p-4">
		<span class="text-xs font-medium text-muted">Almacenamiento</span>

		<div class="flex items-center gap-2 text-sm">
			<Folder size={16} class="text-muted" />
			<span class="text-muted">SQLite — solo en este dispositivo</span>
		</div>

		<button
			onclick={handleExport}
			disabled={exporting}
			class="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 text-sm text-foreground transition-colors hover:opacity-80 disabled:opacity-50"
		>
			<Download size={16} />
			{exporting ? "Exportando..." : "Exportar backup"}
		</button>

		<label
			class="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 text-sm text-foreground transition-colors hover:opacity-80 disabled:opacity-50 cursor-pointer"
		>
			<Upload size={16} />
			{importing ? "Importando..." : "Importar backup"}
			<input
				type="file"
				accept=".json"
				class="hidden"
				onchange={handleFileSelected}
				disabled={importing}
			/>
		</label>

		{#if lastBackupAt}
			<div class="text-xs text-muted">
				Último backup: {formatBackupDate(lastBackupAt)}
			</div>
		{/if}
		{#if daysSinceBackup !== null && daysSinceBackup > 7}
			<div class="text-xs text-expense">
				Hace {daysSinceBackup} días que no exportás tu backup.
			</div>
		{/if}
	</div>

	<button
		onclick={() => goto("/settings/categories")}
		class="flex items-center gap-2 rounded-xl border border-border p-4 text-sm text-foreground transition-colors hover:opacity-80"
	>
		<Tags size={16} />
		Gestionar categorías
	</button>

	<SafSyncSection />

	<div
		class="flex items-center justify-between rounded-xl border border-border p-4"
	>
		<span>Acerca de trackersimple</span>
		<span class="text-xs text-muted">v0.0.1</span>
	</div>
</div>

<AlertDialog.Root bind:open={confirmOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>¿Importar backup?</AlertDialog.Title>
			<AlertDialog.Description>
				Esto reemplazará todos tus datos actuales. Esta acción no se
				puede deshacer.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleImportConfirmed}>
				{importing ? "Importando..." : "Importar"}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
