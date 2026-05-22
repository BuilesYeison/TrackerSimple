import type { AppSettings } from '../../domain/entities/AppSettings';
import type { IAppSettingsRepository } from '../../domain/repositories/IAppSettingsRepository';
import type { AppDatabase } from '../db/database';

export class DexieAppSettingsRepository implements IAppSettingsRepository {
	constructor(private db: AppDatabase) {}

	async get(): Promise<AppSettings | null> {
		return (await this.db.settings.get('default')) ?? null;
	}

	async save(settings: AppSettings): Promise<void> {
		await this.db.settings.put(settings);
	}
}
