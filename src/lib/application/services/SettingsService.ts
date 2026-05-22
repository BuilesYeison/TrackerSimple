import type { Currency } from '../../domain/entities/enums';
import type { IAppSettingsRepository } from '../../domain/repositories/IAppSettingsRepository';

export class SettingsService {
	constructor(private repo: IAppSettingsRepository) {}

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
		});
	}
}
