<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { Download, Upload, Folder } from "@lucide/svelte";
	import JSZip from "jszip";
	import { settingsService, workspaceReady } from "$lib/presentation/stores/workspace";
	import { getDb } from "$lib/infrastructure/db";
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
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al guardar configuración");
		} finally {
			saving = false;
		}
	}

	async function collectWorkspace() {
		const db = getDb();
		const accounts = await db.accounts.toArray();
		const categories = await db.categories.toArray();
		const settings = await db.settings.get("default");
		const records = await db.records.toArray();

		const recordsByMonth = new Map<string, object[]>();
		for (const r of records) {
			const d = r.date instanceof Date ? r.date : r.createdAt;
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			if (!recordsByMonth.has(key)) recordsByMonth.set(key, []);
			recordsByMonth.get(key)!.push(r);
		}

		const manifest = {
			version: 1,
			exportedAt: new Date().toISOString(),
			recordCount: records.length,
			settingsCurrency: settings?.currency ?? "COP",
		};

		return { manifest, accounts, categories, settings, recordsByMonth };
	}

	async function handleExport() {
		exporting = true;
		try {
			const { manifest, accounts, categories, settings, recordsByMonth } = await collectWorkspace();

			const zip = new JSZip();
			const workspace = zip.folder("workspace")!;

			workspace.file("manifest.json", JSON.stringify(manifest, null, 2));
			workspace.file("accounts.json", JSON.stringify(accounts, null, 2));
			workspace.file("categories.json", JSON.stringify(categories, null, 2));
			workspace.file("settings.json", JSON.stringify(settings, null, 2));

			const recordsFolder = workspace.folder("records")!;
			for (const [month, recs] of recordsByMonth) {
				recordsFolder.file(`${month}.json`, JSON.stringify(recs, null, 2));
			}

			const blob = await zip.generateAsync({ type: "blob" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `personalfinapp_backup_${new Date().toISOString().split("T")[0]}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success("Backup exportado");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al exportar");
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
			const zip = await JSZip.loadAsync(file);
			const prefix = "workspace/";

			const manifestFile = zip.file(`${prefix}manifest.json`);
			if (!manifestFile) throw new Error("manifest.json no encontrado en el backup");

			const accountsFile = zip.file(`${prefix}accounts.json`);
			const categoriesFile = zip.file(`${prefix}categories.json`);
			const settingsFile = zip.file(`${prefix}settings.json`);

			const accounts = accountsFile ? JSON.parse(await accountsFile.async("string")) : [];
			const categories = categoriesFile ? JSON.parse(await categoriesFile.async("string")) : [];
			const settings = settingsFile ? JSON.parse(await settingsFile.async("string")) : null;

			const records: object[] = [];
			const recordsDir = `${prefix}records/`;
			for (const [path, entry] of Object.entries(zip.files)) {
				if (path.startsWith(recordsDir) && !entry.dir) {
					const monthRecords = JSON.parse(await entry.async("string"));
					records.push(...monthRecords);
				}
			}

			const db = getDb();
			await db.accounts.clear();
			await db.categories.clear();
			await db.records.clear();
			await db.settings.clear();

			await db.accounts.bulkAdd(accounts);
			await db.categories.bulkAdd(categories);
			if (records.length > 0) {
				for (const r of records as any[]) {
					if (typeof r.date === 'string') r.date = new Date(r.date);
					if (typeof r.createdAt === 'string') r.createdAt = new Date(r.createdAt);
					if (typeof r.updatedAt === 'string') r.updatedAt = new Date(r.updatedAt);
				}
				await db.records.bulkAdd(records as any[]);
			}
			if (settings) await db.settings.put(settings as any);

			toast.success("Datos importados correctamente");
			setTimeout(() => window.location.reload(), 800);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al importar");
		} finally {
			importing = false;
			input.value = "";
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
			<span class="text-muted">Documents / PersonalFinApp</span>
		</div>
		<button
			onclick={handleExport}
			disabled={exporting}
			class="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 text-sm text-foreground transition-colors hover:opacity-80 disabled:opacity-50"
		>
			<Download size={16} />
			{exporting ? "Exportando..." : "Exportar datos"}
		</button>
		<label class="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 text-sm text-foreground transition-colors hover:opacity-80 disabled:opacity-50 cursor-pointer">
			<Upload size={16} />
			{importing ? "Importando..." : "Importar datos"}
			<input type="file" accept=".zip" class="hidden" onchange={handleImport} disabled={importing} />
		</label>
	</div>

	<div class="flex items-center justify-between rounded-xl border border-border p-4">
		<span>Acerca de PersonalFinApp</span>
		<span class="text-xs text-muted">v0.0.1</span>
	</div>
</div>
