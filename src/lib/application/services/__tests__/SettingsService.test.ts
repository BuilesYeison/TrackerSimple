import { describe, it, expect, vi } from 'vitest';
import { SettingsService } from '../SettingsService';
import type { IAppSettingsRepository } from '$lib/domain/repositories';
import type { AppSettings } from '$lib/domain/entities/AppSettings';

function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
	return {
		key: 'default',
		currency: 'COP',
		onboardingCompleted: false,
		...overrides,
	};
}

function mockRepo(saved?: AppSettings): IAppSettingsRepository {
	return {
		get: vi.fn().mockResolvedValue(saved ?? makeSettings()),
		save: vi.fn().mockResolvedValue(undefined),
	};
}

describe('SettingsService', () => {
	describe('getCurrency', () => {
		it('returns currency from settings', async () => {
			const repo = mockRepo(makeSettings({ currency: 'USD' }));
			const svc = new SettingsService(repo);

			expect(await svc.getCurrency()).toBe('USD');
		});

		it('defaults to COP when no settings exist', async () => {
			const repo = mockRepo();
			repo.get = vi.fn().mockResolvedValue(null);
			const svc = new SettingsService(repo);

			expect(await svc.getCurrency()).toBe('COP');
		});
	});

	describe('setCurrency', () => {
		it('changes currency and preserves all optional fields', async () => {
			const original = makeSettings({
				onboardingCompleted: true,
				safUri: 'content://tree/abc',
				lastBackupAt: '2025-01-01T00:00:00Z',
				lastSyncAt: '2025-06-01T00:00:00Z',
				syncFileName: 'mi-backup.json',
			});
			const repo = mockRepo(original);
			const svc = new SettingsService(repo);

			await svc.setCurrency('EUR');

			expect(repo.save).toHaveBeenCalledTimes(1);
			const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppSettings;

			expect(saved.currency).toBe('EUR');
			expect(saved.onboardingCompleted).toBe(true);
			expect(saved.safUri).toBe('content://tree/abc');
			expect(saved.lastBackupAt).toBe('2025-01-01T00:00:00Z');
			expect(saved.lastSyncAt).toBe('2025-06-01T00:00:00Z');
			expect(saved.syncFileName).toBe('mi-backup.json');
		});

		it('works when no settings exist yet', async () => {
			const repo = mockRepo();
			repo.get = vi.fn().mockResolvedValue(null);
			const svc = new SettingsService(repo);

			await svc.setCurrency('ARS');

			const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppSettings;
			expect(saved.currency).toBe('ARS');
			expect(saved.onboardingCompleted).toBe(false);
		});
	});

	describe('completeOnboarding', () => {
		it('sets onboardingCompleted to true and preserves other fields', async () => {
			const original = makeSettings({
				currency: 'USD',
				safUri: 'content://tree/xyz',
				lastSyncAt: '2025-05-01T00:00:00Z',
				syncFileName: 'backup.json',
			});
			const repo = mockRepo(original);
			const svc = new SettingsService(repo);

			await svc.completeOnboarding();

			const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppSettings;

			expect(saved.onboardingCompleted).toBe(true);
			expect(saved.currency).toBe('USD');
			expect(saved.safUri).toBe('content://tree/xyz');
			expect(saved.lastSyncAt).toBe('2025-05-01T00:00:00Z');
			expect(saved.syncFileName).toBe('backup.json');
		});

		it('defaults currency to COP when settings are null', async () => {
			const repo = mockRepo();
			repo.get = vi.fn().mockResolvedValue(null);
			const svc = new SettingsService(repo);

			await svc.completeOnboarding();

			const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppSettings;
			expect(saved.currency).toBe('COP');
			expect(saved.onboardingCompleted).toBe(true);
		});
	});

	describe('isOnboardingCompleted', () => {
		it('returns true when onboarding is completed', async () => {
			const repo = mockRepo(makeSettings({ onboardingCompleted: true }));
			const svc = new SettingsService(repo);

			expect(await svc.isOnboardingCompleted()).toBe(true);
		});

		it('returns false when onboarding is not completed', async () => {
			const repo = mockRepo(makeSettings({ onboardingCompleted: false }));
			const svc = new SettingsService(repo);

			expect(await svc.isOnboardingCompleted()).toBe(false);
		});

		it('returns false when no settings exist', async () => {
			const repo = mockRepo();
			repo.get = vi.fn().mockResolvedValue(null);
			const svc = new SettingsService(repo);

			expect(await svc.isOnboardingCompleted()).toBe(false);
		});
	});

	describe('updateSettings', () => {
		it('delegates to repo.save', async () => {
			const repo = mockRepo();
			const svc = new SettingsService(repo);
			const settings = makeSettings({ currency: 'MXN' });

			await svc.updateSettings(settings);
			expect(repo.save).toHaveBeenCalledWith(settings);
		});
	});
});
