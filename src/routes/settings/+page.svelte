<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { Download, Upload, Folder } from "@lucide/svelte";
	import { Share } from "@capacitor/share";
	import JSZip from "jszip";
	import { settingsService, workspaceReady } from "$lib/presentation/stores/workspace";
	import { getDB } from "$lib/infrastructure/db/sqlite";
	import type { Currency } from "$lib/domain/entities";

	let currency = $state<Currency>("COP");
	let saving = $state(false);
	let exporting = $state(false);
	let importing = $state(false);
	let syncing = $state(false);
	let lastBackupAt = $state<string | null>(null);

	onMount(async () => {
		await workspaceReady;
		currency = await settingsService.getCurrency();
		const settings = await settingsService.getSettings();
		lastBackupAt = settings?.lastBackupAt ?? null;
	});

	const daysSinceBackup = $derived(
		lastBackupAt
			? Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60 * 24))
			: null,
	);

	function formatBackupDate(iso: string): string {
		const date = new Date(iso);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMin = Math.floor(diffMs / 60000);
		const diffHr = Math.floor(diffMs / 3600000);
		const diffDay = Math.floor(diffMs / 86400000);

		if (diffMin < 1) return "ahora";
		if (diffMin < 60) return `hace ${diffMin} min`;
		if (diffHr < 24) return `hace ${diffHr}h`;
		if (diffDay === 1) return "ayer";
		if (diffDay < 7) return `hace ${diffDay} días`;
		return date.toLocaleDateString("es", { day: "numeric", month: "short" });
	}

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
		const db = getDB();
		const accounts = (await db.query("SELECT * FROM accounts")).values ?? [];
		const categories = (await db.query("SELECT * FROM categories")).values ?? [];
		const settings = (await db.query("SELECT * FROM settings WHERE key = ?", ["default"])).values?.[0] ?? null;
		const records = (await db.query("SELECT * FROM records ORDER BY date ASC")).values ?? [];

		const recordsByMonth = new Map<string, object[]>();
		for (const r of records) {
			const d = new Date(r.date);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			if (!recordsByMonth.has(key)) recordsByMonth.set(key, []);
			recordsByMonth.get(key)!.push(r);
		}

		const manifest = { version: 1, exportedAt: new Date().toISOString(), recordCount: records.length, settingsCurrency: settings?.currency ?? "COP" };
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

			const now = new Date().toISOString();
			const current = await settingsService.getSettings();
			if (current) {
				current.lastBackupAt = now;
				await settingsService.updateSettings(current);
			}
			lastBackupAt = now;

			try {
				const base64 = await blobToBase64(blob);
				await Share.share({
					title: "Backup PersonalFinApp",
					text: "Backup de mis finanzas personales",
					files: [base64],
				});
				toast.success("Backup exportado");
			} catch {
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `personalfinapp_backup_${new Date().toISOString().split("T")[0]}.zip`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				toast.success("Backup exportado");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al exportar");
		} finally {
			exporting = false;
		}
	}

	function blobToBase64(blob: Blob): Promise<string> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const result = reader.result as string;
				resolve(result.split(",")[1]);
			};
			reader.readAsDataURL(blob);
		});
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

			const db = getDB();
			await db.execute("DELETE FROM accounts");
			await db.execute("DELETE FROM categories");
			await db.execute("DELETE FROM records");

			for (const a of accounts as any[]) {
				await db.run(
					`INSERT INTO accounts (id, name, type, currency, balance, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
					[a.id, a.name, a.type, a.currency, a.balance ?? 0, a.isActive ? 1 : 0, a.createdAt ?? new Date().toISOString(), a.updatedAt ?? new Date().toISOString()],
				);
			}
			for (const c of categories as any[]) {
				await db.run(
					`INSERT INTO categories (id, name, type, isDefault, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
					[c.id, c.name, c.type, c.isDefault ? 1 : 0, c.createdAt ?? new Date().toISOString(), c.updatedAt ?? new Date().toISOString()],
				);
			}
			for (const r of records as any[]) {
				await db.run(
					`INSERT INTO records (id, type, amount, accountId, toAccountId, categoryId, note, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[r.id, r.type, r.amount, r.accountId, r.toAccountId ?? null, r.categoryId, r.note ?? null, r.date instanceof Date ? r.date.toISOString() : r.date, r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt, r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt],
				);
			}
			if (settings) {
				await db.run(
					`INSERT OR REPLACE INTO settings (key, currency, onboardingCompleted, lastBackupAt) VALUES (?, ?, ?, ?)`,
					[settings.key, settings.currency, settings.onboardingCompleted ? 1 : 0, settings.lastBackupAt ?? null],
				);
			}
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

		<label class="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 text-sm text-foreground transition-colors hover:opacity-80 disabled:opacity-50 cursor-pointer">
			<Upload size={16} />
			{importing ? "Importando..." : "Importar backup"}
			<input type="file" accept=".zip" class="hidden" onchange={handleImport} disabled={importing} />
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

	<div class="flex items-center justify-between rounded-xl border border-border p-4">
		<span>Acerca de PersonalFinApp</span>
		<span class="text-xs text-muted">v0.0.1</span>
	</div>
</div>
