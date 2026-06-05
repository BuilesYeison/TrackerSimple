import type { Currency } from '$lib/domain/entities/enums';
import type { AppSettings } from '../../domain/entities/AppSettings';
import type { IAppSettingsRepository } from '../../domain/repositories/IAppSettingsRepository';
import { getDB } from '../db/sqlite';
import { type SqliteRow } from '../db/sqlite-helpers';

function mapRow(row: SqliteRow): AppSettings {
	return {
		key: row.key as string,
		currency: row.currency as Currency,
		onboardingCompleted: Boolean(row.onboardingCompleted),
		lastBackupAt: (row.lastBackupAt as string | undefined) || undefined,
		safUri: (row.safUri as string | undefined) || undefined,
		lastSyncAt: (row.lastSyncAt as string | undefined) || undefined,
		syncFileName: (row.syncFileName as string | undefined) || undefined,
	};
}

export class SqliteAppSettingsRepository implements IAppSettingsRepository {
	async get(): Promise<AppSettings | null> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM settings WHERE key = ?`, ['default']);
		return result.values?.[0] ? mapRow(result.values[0]) : null;
	}

	async save(settings: AppSettings): Promise<void> {
		const db = getDB();
		await db.run(
			`INSERT OR REPLACE INTO settings (key, currency, onboardingCompleted, lastBackupAt, safUri, lastSyncAt, syncFileName) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			['default', settings.currency, settings.onboardingCompleted ? 1 : 0, settings.lastBackupAt || null, settings.safUri || null, settings.lastSyncAt || null, settings.syncFileName || null],
		);
	}
}
