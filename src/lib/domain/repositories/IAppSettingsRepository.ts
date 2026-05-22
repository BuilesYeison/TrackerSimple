import type { AppSettings } from '../entities/AppSettings';

export interface IAppSettingsRepository {
	get(): Promise<AppSettings | null>;
	save(settings: AppSettings): Promise<void>;
}
