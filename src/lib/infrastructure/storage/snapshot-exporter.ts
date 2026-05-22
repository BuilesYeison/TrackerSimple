import JSZip from "jszip";
import { getDb } from "../db/database";
import { writeSnapshot } from "./opfs";
import type { SnapshotManifest } from "../../domain/entities/SnapshotManifest";

async function collectWorkspace() {
	const db = getDb();
	const accounts = await db.accounts.toArray();
	const categories = await db.categories.toArray();
	const settings = await db.settings.get("default");
	const records = await db.records.toArray();

	const manifest: SnapshotManifest = {
		version: 1,
		exportedAt: new Date().toISOString(),
		recordCount: records.length,
		settingsCurrency: settings?.currency ?? "COP",
	};

	const recordsByMonth = new Map<string, object[]>();
	for (const r of records) {
		const d = r.date instanceof Date ? r.date : r.createdAt;
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		if (!recordsByMonth.has(key)) recordsByMonth.set(key, []);
		recordsByMonth.get(key)!.push(r);
	}

	return { manifest, accounts, categories, settings: settings ?? null, recordsByMonth };
}

export async function snapshotToOPFS(): Promise<void> {
	const { manifest, accounts, categories, settings, recordsByMonth } = await collectWorkspace();

	await writeSnapshot("manifest.json", manifest);
	await writeSnapshot("accounts.json", accounts);
	await writeSnapshot("categories.json", categories);
	await writeSnapshot("settings.json", settings);

	for (const [month, recs] of recordsByMonth) {
		await writeSnapshot(`records/${month}.json`, recs);
	}
}

export async function exportToZip(): Promise<void> {
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
}
