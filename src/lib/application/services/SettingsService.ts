import type { Currency } from '../../domain/entities/enums';
import type { AppSettings } from '../../domain/entities/AppSettings';
import type { IAppSettingsRepository } from '../../domain/repositories/IAppSettingsRepository';

export class SettingsService {
	constructor(private repo: IAppSettingsRepository) { }

	async getCurrency(): Promise<Currency> {
		const settings = await this.repo.get();
		return settings?.currency ?? 'COP';
	}

	async setCurrency(currency: Currency): Promise<void> {
		const settings = await this.repo.get();
		await this.repo.save({
			key: 'default',
			currency,
			onboardingCompleted: settings?.onboardingCompleted ?? false,
			lastBackupAt: settings?.lastBackupAt,
			safUri: settings?.safUri,
			lastSyncAt: settings?.lastSyncAt,
			syncFileName: settings?.syncFileName,
		});
	}

	async isOnboardingCompleted(): Promise<boolean> {
		const settings = await this.repo.get();
		return settings?.onboardingCompleted ?? false;
	}

	async completeOnboarding(): Promise<void> {
		const settings = await this.repo.get();
		await this.repo.save({
			key: 'default',
			currency: settings?.currency ?? 'COP',
			onboardingCompleted: true,
			lastBackupAt: settings?.lastBackupAt,
			safUri: settings?.safUri,
			lastSyncAt: settings?.lastSyncAt,
			syncFileName: settings?.syncFileName,
		});
	}

	async getSettings(): Promise<AppSettings | null> {
		return this.repo.get();
	}

	async updateSettings(settings: AppSettings): Promise<void> {
		await this.repo.save(settings);
	}
}
