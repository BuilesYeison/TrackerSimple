import { getDB } from '../../infrastructure/db/sqlite';

export interface BackupData {
	version: string;
	exportedAt: string;
	accounts: unknown[];
	categories: unknown[];
	settings: unknown;
	records: Record<string, unknown[]>;
	checksum?: string;
}

async function sha256(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const buffer = encoder.encode(data);
	const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class ExportService {
	async createBackup(): Promise<string> {
		const db = getDB();
		const accounts = (await db.query("SELECT * FROM accounts")).values ?? [];
		const categories = (await db.query("SELECT * FROM categories")).values ?? [];
		const settings =
			(await db.query("SELECT * FROM settings WHERE key = ?", ["default"])).values?.[0] ?? null;
		const allRecords = (await db.query("SELECT * FROM records ORDER BY date ASC")).values ?? [];

		const recordsByMonth: Record<string, object[]> = {};
		for (const r of allRecords) {
			const d = new Date(r.date);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			if (!recordsByMonth[key]) recordsByMonth[key] = [];
			recordsByMonth[key].push(r);
		}

		const backup: BackupData = {
			version: "1.0",
			exportedAt: new Date().toISOString(),
			accounts,
			categories,
			settings,
			records: recordsByMonth,
		};

		const contentWithoutChecksum = JSON.stringify(backup, null, 2);
		backup.checksum = await sha256(contentWithoutChecksum);

		return JSON.stringify(backup, null, 2);
	}
}
