<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Folder } from '@lucide/svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import {
		settingsService,
		workspaceReady,
		exportService,
		importService,
	} from '$lib/presentation/stores/workspace';
	import { closeDatabase } from '$lib/infrastructure/db/sqlite';
	import { SafPlugin } from '$lib/plugins/saf';

	let safUri = $state<string | null>(null);
	let lastSyncAt = $state<string | null>(null);
	let syncFileName = $state('trackeo-backup.json');
	let syncing = $state(false);
	let importingFromFolder = $state(false);
	let confirmOpen = $state(false);
	let pendingFile = $state<File | null>(null);

	const { onsuccess } = $props<{ onsuccess?: () => void }>();

	onMount(async () => {
		await workspaceReady;
		const settings = await settingsService.getSettings();
		safUri = settings?.safUri ?? null;
		lastSyncAt = settings?.lastSyncAt ?? null;
		syncFileName = settings?.syncFileName || 'trackeo-backup.json';
	});

	async function handlePickFolder() {
		try {
			const result = await SafPlugin.pickFolder();
			safUri = result.uri;
			const current = await settingsService.getSettings();
			if (current) {
				current.safUri = result.uri;
				await settingsService.updateSettings(current);
			}
			toast.success('Carpeta configurada');
		} catch (err) {
			console.error(err);
			if (err instanceof Error && err.message !== 'Selección cancelada') {
				toast.error(err.message);
			}
		}
	}

	async function handleChangeFolder() {
		await handlePickFolder();
	}

	async function handleSyncNow() {
		syncing = true;
		try {
			if (!safUri) {
				toast.warning('Configurá una carpeta primero');
				return;
			}
			const json = await exportService.createBackup();
			await SafPlugin.writeFile({
				uri: safUri,
				name: syncFileName || 'trackeo-backup.json',
				data: json,
			});
			const now = new Date().toISOString();
			const current = await settingsService.getSettings();
			if (current) {
				current.lastSyncAt = now;
				current.syncFileName = syncFileName || 'trackeo-backup.json';
				await settingsService.updateSettings(current);
			}
			lastSyncAt = now;
			toast.success('Sincronizado');
			onsuccess?.();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Error al sincronizar',
			);
		} finally {
			syncing = false;
		}
	}

	async function handleImportFromFolder() {
		importingFromFolder = true;
		try {
			if (!safUri) {
				toast.warning('Configurá una carpeta primero');
				return;
			}
			const result = await SafPlugin.readFile({
				uri: safUri,
				name: syncFileName || 'trackeo-backup.json',
			});
			const blob = new Blob([result.data], { type: 'application/json' });
			const file = new File([blob], syncFileName || 'trackeo-backup.json', {
				type: 'application/json',
			});
			pendingFile = file;
			confirmOpen = true;
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Error al leer backup',
			);
		} finally {
			importingFromFolder = false;
		}
	}

	async function handleImportConfirmed() {
		if (!pendingFile) return;
		importingFromFolder = true;
		try {
			await importService.importFromFile(pendingFile);
			toast.success('Datos importados correctamente');
			await closeDatabase();
			setTimeout(() => window.location.reload(), 800);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Error al importar',
			);
		} finally {
			importingFromFolder = false;
			pendingFile = null;
			confirmOpen = false;
		}
	}

	function formatSyncDate(iso: string): string {
		const date = new Date(iso);
		const now = new Date();
		const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
		if (diffMin < 1) return 'ahora';
		if (diffMin < 60) return `hace ${diffMin} min`;
		const diffHr = Math.floor(diffMin / 60);
		if (diffHr < 24) return `hace ${diffHr}h`;
		return `hace ${Math.floor(diffHr / 24)} días`;
	}
</script>

<div class="flex flex-col gap-3 rounded-xl border border-border p-4">
	<span class="text-xs font-medium text-muted">Sync automático</span>

	{#if !safUri}
		<div class="flex items-center gap-2 text-sm text-muted">
			Sin configurar
		</div>
		<button
			onclick={handlePickFolder}
			class="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 text-sm text-foreground transition-colors hover:opacity-80"
		>
			<Folder size={16} />
			Configurar carpeta
		</button>
	{:else}
		<div class="flex items-center gap-2 text-sm text-muted">
			<Folder size={16} class="text-income" />
			<span>Sync activo</span>
		</div>
		{#if lastSyncAt}
			<div class="text-xs text-muted">
				Último sync: {formatSyncDate(lastSyncAt)}
			</div>
		{/if}
		<div class="flex items-center gap-2">
			<span class="text-xs text-muted whitespace-nowrap">Archivo:</span>
			<span class="text-sm text-foreground">{syncFileName || 'trackeo-backup.json'}</span>
		</div>
		<div class="flex flex-col gap-2">
			<button
				onclick={handleSyncNow}
				disabled={syncing}
				class="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 text-sm text-foreground transition-colors hover:opacity-80 disabled:opacity-50"
			>
				{syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
			</button>
			<div class="flex gap-2">
				<button
					onclick={handleChangeFolder}
					class="flex-1 rounded-lg bg-surface-raised px-3 py-2 text-xs text-muted transition-colors hover:opacity-80">Cambiar carpeta</button
				>
				<button
					onclick={handleImportFromFolder}
					disabled={importingFromFolder}
					class="flex-1 rounded-lg bg-surface-raised px-3 py-2 text-xs text-muted transition-colors hover:opacity-80 disabled:opacity-50"
				>
					{importingFromFolder
						? 'Leyendo...'
						: 'Importar desde carpeta'}
				</button>
			</div>
		</div>
	{/if}
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
				{importingFromFolder ? 'Importando...' : 'Importar'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
