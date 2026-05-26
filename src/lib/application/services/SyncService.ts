import { SafPlugin } from '../../plugins/saf';
import { getDB } from '../../infrastructure/db/sqlite';

let settingsRepo: any = null;

export function setSyncSettingsRepo(repo: any) {
	settingsRepo = repo;
}

export async function triggerSync(): Promise<void> {
	try {
		if (!settingsRepo) return;
		const settings = await settingsRepo.get();
		if (!settings?.safUri) return;

		const hasPerm = await SafPlugin.hasPermission({ uri: settings.safUri });
		if (!hasPerm.valid) return;

		const db = getDB();
		const accounts = (await db.query("SELECT * FROM accounts")).values ?? [];
		const categories = (await db.query("SELECT * FROM categories")).values ?? [];
		const dbSettings = (await db.query("SELECT * FROM settings WHERE key = ?", ["default"])).values?.[0] ?? null;
		const allRecords = (await db.query("SELECT * FROM records ORDER BY date ASC")).values ?? [];

		const recordsByMonth: Record<string, object[]> = {};
		for (const r of allRecords) {
			const d = new Date(r.date);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			if (!recordsByMonth[key]) recordsByMonth[key] = [];
			recordsByMonth[key].push(r);
		}

		const backup = { version: "1.0", exportedAt: new Date().toISOString(), accounts, categories, settings: dbSettings, records: recordsByMonth };
		const contentWithoutChecksum = JSON.stringify(backup, null, 2);

		const encoder = new TextEncoder();
		const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(contentWithoutChecksum));
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		(backup as any).checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

		const json = JSON.stringify(backup, null, 2);
		await SafPlugin.writeFile({ uri: settings.safUri, name: 'trackeo-backup.json', data: json });

		settings.lastSyncAt = new Date().toISOString();
		await settingsRepo.save(settings);
	} catch {
		// Sync is silent
	}
}
