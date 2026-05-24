import type { AppSettings } from '../../domain/entities/AppSettings';
import type { IAppSettingsRepository } from '../../domain/repositories/IAppSettingsRepository';
import { getDB } from '../db/sqlite';

function mapRow(row: any): AppSettings {
	return {
		key: row.key,
		currency: row.currency,
		onboardingCompleted: Boolean(row.onboardingCompleted),
		lastBackupAt: row.lastBackupAt || undefined,
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
		const existing = await this.get();
		if (existing) {
			await db.run(
				`UPDATE settings SET currency = ?, onboardingCompleted = ?, lastBackupAt = ? WHERE key = ?`,
				[settings.currency, settings.onboardingCompleted ? 1 : 0, settings.lastBackupAt || null, 'default'],
			);
		} else {
			await db.run(
				`INSERT INTO settings (key, currency, onboardingCompleted, lastBackupAt) VALUES (?, ?, ?, ?)`,
				['default', settings.currency, settings.onboardingCompleted ? 1 : 0, settings.lastBackupAt || null],
			);
		}
	}
}
