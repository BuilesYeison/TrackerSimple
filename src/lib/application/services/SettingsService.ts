import type { Currency } from '../../domain/entities/enums';
import type { IAppSettingsRepository } from '../../domain/repositories/IAppSettingsRepository';

export class SettingsService {
	constructor(private repo: IAppSettingsRepository) {}

	async getCurrency(): Promise<Currency> {
		const settings = await this.repo.get();
		return settings?.currency ?? 'COP';
	}

	async setCurrency(currency: Currency): Promise<void> {
		await this.repo.save({ key: 'default', currency });
	}
}
