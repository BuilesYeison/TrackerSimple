import type { AppSettings } from '../../domain/entities/AppSettings';
import type { IAppSettingsRepository } from '../../domain/repositories/IAppSettingsRepository';
import type { AppDatabase } from '../db/database';
import type { JsonFileStore } from '../storage/json-store';

export class DexieAppSettingsRepository implements IAppSettingsRepository {
	constructor(
		private db: AppDatabase,
		private jsonStore: JsonFileStore,
	) {}

	async get(): Promise<AppSettings | null> {
		return (await this.db.settings.get('default')) ?? null;
	}

	async save(settings: AppSettings): Promise<void> {
		await this.db.settings.put(settings);
		await this.jsonStore.saveSettings(settings);
	}
}
