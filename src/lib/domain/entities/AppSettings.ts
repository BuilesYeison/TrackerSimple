import type { Currency } from './enums';

export interface AppSettings {
	key: string;
	currency: Currency;
	onboardingCompleted: boolean;
	lastBackupAt?: string;
}
