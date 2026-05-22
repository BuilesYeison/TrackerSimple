import JSZip from "jszip";
import { getDb } from "../db/database";
import { readSnapshot } from "./opfs";
import type { SnapshotManifest } from "../../domain/entities/SnapshotManifest";

export async function restoreFromSnapshot(): Promise<boolean> {
	const manifest = await readSnapshot<SnapshotManifest>("workspace");
	if (!manifest) return false;

	const db = getDb();

	const root = await navigator.storage.getDirectory();
	const dir = await root.getDirectoryHandle("workspace");

	async function readFile(filename: string): Promise<object[] | null> {
		try {
			const handle = await dir.getFileHandle(filename);
			const file = await handle.getFile();
			return JSON.parse(await file.text());
		} catch {
			return null;
		}
	}

	const accounts = (await readFile("accounts.json")) ?? [];
	const categories = (await readFile("categories.json")) ?? [];
	const settings = await readFile("settings.json");

	await db.accounts.clear();
	await db.categories.clear();
	await db.records.clear();
	await db.settings.clear();

	await db.accounts.bulkAdd(accounts as any[]);
	await db.categories.bulkAdd(categories as any[]);
	if (settings?.[0]) {
		await db.settings.put(settings[0] as any);
	}

	const recordsDir = await dir.getDirectoryHandle("records");
	const records: object[] = [];
	for await (const [name] of recordsDir.entries()) {
		const recordsHandle = await recordsDir.getFileHandle(name);
		const file = await recordsHandle.getFile();
		const monthRecords = JSON.parse(await file.text());
		records.push(...monthRecords);
	}
	await db.records.bulkAdd(records as any[]);

	return true;
}

async function parseImportFile(file: File): Promise<{
	manifest: SnapshotManifest;
	accounts: object[];
	categories: object[];
	settings: object | null;
	records: object[];
}> {
	const ext = file.name.split(".").pop()?.toLowerCase();

	if (ext === "zip") {
		const zip = await JSZip.loadAsync(file);
		const prefix = "workspace/";

		const manifestFile = zip.file(`${prefix}manifest.json`);
		const accountsFile = zip.file(`${prefix}accounts.json`);
		const categoriesFile = zip.file(`${prefix}categories.json`);
		const settingsFile = zip.file(`${prefix}settings.json`);

		if (!manifestFile) throw new Error("manifest.json no encontrado");

		const manifest = JSON.parse(await manifestFile.async("string"));
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

		return { manifest, accounts, categories, settings, records };
	}

	throw new Error("Formato no soportado. Usá un archivo .zip");
}

export async function importFromFile(file: File): Promise<void> {
	const data = await parseImportFile(file);
	const db = getDb();

	await db.accounts.clear();
	await db.categories.clear();
	await db.records.clear();
	await db.settings.clear();

	await db.accounts.bulkAdd(data.accounts as any[]);
	await db.categories.bulkAdd(data.categories as any[]);
	if (data.settings) {
		await db.settings.put(data.settings as any);
	}
	await db.records.bulkAdd(data.records as any[]);
}
