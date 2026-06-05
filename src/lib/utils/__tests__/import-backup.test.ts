import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importBackupFromFile } from '$lib/utils/import-backup';
import { getDB } from '$lib/infrastructure/db/sqlite';

vi.mock('$lib/infrastructure/db/sqlite', () => ({
	getDB: vi.fn(),
}));

function makeValidBackup() {
	return {
		version: '1.0',
		exportedAt: new Date().toISOString(),
		accounts: [
			{ id: 'a1', name: 'Efectivo', type: 'cash', currency: 'COP', balance: 1000, isActive: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		],
		categories: [
			{ id: 'c1', name: 'Comida', type: 'expense', isDefault: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		],
		settings: {
			key: 'default', currency: 'COP', onboardingCompleted: 0, lastBackupAt: null,
		},
		records: {
			'2025-06': [
				{ id: 'r1', type: 'expense', amount: 15000, accountId: 'a1', toAccountId: null, categoryId: 'c1', note: null, tag: null, date: '2025-06-01T00:00:00Z', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z' },
			],
		},
	};
}

function makeFile(json: unknown): File {
	return new File([JSON.stringify(json)], 'backup.json', { type: 'application/json' });
}

describe('importBackupFromFile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const mockDB = {
			executeSet: vi.fn().mockResolvedValue(undefined),
		};
		(getDB as ReturnType<typeof vi.fn>).mockReturnValue(mockDB);
	});

	describe('validation errors', () => {
		it('rejects invalid JSON', async () => {
			const file = new File(['not json'], 'bad.json', { type: 'application/json' });
			await expect(importBackupFromFile(file)).rejects.toThrow('El archivo no es un JSON válido.');
		});

		it('rejects non-object backup', async () => {
			await expect(importBackupFromFile(makeFile('string'))).rejects.toThrow('Formato de backup inválido.');
		});

		it('rejects null backup', async () => {
			await expect(importBackupFromFile(makeFile(null))).rejects.toThrow('Formato de backup inválido.');
		});

		it('rejects missing version', async () => {
			const backup = makeValidBackup();
			delete (backup as any).version;
			await expect(importBackupFromFile(makeFile(backup))).rejects.toThrow('Falta \'version\'');
		});

		it('rejects non-string version', async () => {
			const backup = makeValidBackup();
			(backup as any).version = 123;
			await expect(importBackupFromFile(makeFile(backup))).rejects.toThrow("Falta 'version' o no es un string");
		});

		it('rejects missing accounts array', async () => {
			const backup = { ...makeValidBackup(), accounts: 'not-array' };
			await expect(importBackupFromFile(makeFile(backup))).rejects.toThrow("'accounts' debe ser un array");
		});

		it('rejects missing categories array', async () => {
			const backup = { ...makeValidBackup(), categories: null };
			await expect(importBackupFromFile(makeFile(backup))).rejects.toThrow("'categories' debe ser un array");
		});

		it('rejects records as null', async () => {
			const backup = { ...makeValidBackup(), records: null };
			await expect(importBackupFromFile(makeFile(backup))).rejects.toThrow("'records' debe ser un objeto");
		});

		it('rejects records as array', async () => {
			const backup = { ...makeValidBackup(), records: [] };
			await expect(importBackupFromFile(makeFile(backup))).rejects.toThrow("'records' debe ser un objeto");
		});

		it('rejects accounts missing required fields', async () => {
			const backup = makeValidBackup();
			backup.accounts = [{ name: 'OnlyName' }];
			await expect(importBackupFromFile(makeFile(backup))).rejects.toThrow("no tiene 'id', 'name' o 'type'");
		});

		it('rejects categories missing required fields', async () => {
			const backup = makeValidBackup();
			backup.categories = [{ id: 'c1' }];
			await expect(importBackupFromFile(makeFile(backup))).rejects.toThrow("no tiene 'id', 'name' o 'type'");
		});

		it('rejects records missing required fields with specific error', async () => {
			const backup = makeValidBackup();
			backup.records = {
				'2025-06': [{ id: 'r1', type: 'expense' }], // missing amount, accountId, categoryId, date
			};
			await expect(importBackupFromFile(makeFile(backup))).rejects.toThrow('falta(n) campo(s): amount, accountId, categoryId, date');
		});

		it('passes records with amount = 0', async () => {
			const backup = makeValidBackup();
			backup.records['2025-06'][0].amount = 0;
			await importBackupFromFile(makeFile(backup));
			// Should not throw - 0 is valid
			expect(getDB).toHaveBeenCalled();
		});
	});

	describe('successful import', () => {
		it('generates correct SQL statements for valid backup', async () => {
			const executeSet = vi.fn().mockResolvedValue(undefined);
			(getDB as ReturnType<typeof vi.fn>).mockReturnValue({ executeSet });

			await importBackupFromFile(makeFile(makeValidBackup()));

			expect(executeSet).toHaveBeenCalledTimes(1);
			const statements = executeSet.mock.calls[0][0];

			// 3 DELETEs + 1 account + 1 category + 1 record + 1 settings = 7 statements
			expect(statements).toHaveLength(7);
			expect(statements[0].statement).toContain('DELETE FROM records');
			expect(statements[1].statement).toContain('DELETE FROM accounts');
			expect(statements[2].statement).toContain('DELETE FROM categories');
		});

		it('handles backup without settings', async () => {
			const executeSet = vi.fn().mockResolvedValue(undefined);
			(getDB as ReturnType<typeof vi.fn>).mockReturnValue({ executeSet });

			const backup = makeValidBackup();
			delete (backup as any).settings;

			await importBackupFromFile(makeFile(backup));

			// 3 DELETEs + 1 account + 1 category + 1 record = 6 statements (no settings)
			const statements = executeSet.mock.calls[0][0];
			expect(statements).toHaveLength(6);
		});

		it('handles multiple months of records', async () => {
			const executeSet = vi.fn().mockResolvedValue(undefined);
			(getDB as ReturnType<typeof vi.fn>).mockReturnValue({ executeSet });

			const backup = makeValidBackup();
			backup.records = {
				'2025-05': [
					{ id: 'r1', type: 'expense', amount: 1000, accountId: 'a1', toAccountId: null, categoryId: 'c1', note: null, tag: null, date: '2025-05-15T00:00:00Z', createdAt: '2025-05-15T00:00:00Z', updatedAt: '2025-05-15T00:00:00Z' },
				],
				'2025-06': [
					{ id: 'r2', type: 'income', amount: 5000, accountId: 'a1', toAccountId: null, categoryId: 'c1', note: null, tag: null, date: '2025-06-01T00:00:00Z', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z' },
					{ id: 'r3', type: 'expense', amount: 2000, accountId: 'a1', toAccountId: null, categoryId: 'c1', note: null, tag: null, date: '2025-06-02T00:00:00Z', createdAt: '2025-06-02T00:00:00Z', updatedAt: '2025-06-02T00:00:00Z' },
				],
			};

			await importBackupFromFile(makeFile(backup));

			// 3 DELETEs + 1 account + 1 category + 3 records + 1 settings = 9 statements
			const statements = executeSet.mock.calls[0][0];
			expect(statements).toHaveLength(9);
		});

		it('uses defaults for missing optional account fields', async () => {
			const executeSet = vi.fn().mockResolvedValue(undefined);
			(getDB as ReturnType<typeof vi.fn>).mockReturnValue({ executeSet });

			const backup = makeValidBackup();
			backup.accounts = [
				{ id: 'a1', name: 'Minimal', type: 'cash' },
			]; // No currency, balance, isActive, timestamps

			await importBackupFromFile(makeFile(backup));

			const statements = executeSet.mock.calls[0][0];
			const accountValues = statements[3].values;
			expect(accountValues[3]).toBe('COP'); // default currency
			expect(accountValues[4]).toBe(0); // default balance
			expect(accountValues[5]).toBe(0); // default isActive (falsy = 0)
		});

		it('handles transfer records with toAccountId', async () => {
			const executeSet = vi.fn().mockResolvedValue(undefined);
			(getDB as ReturnType<typeof vi.fn>).mockReturnValue({ executeSet });

			const backup = makeValidBackup();
			backup.records['2025-06'] = [
				{ id: 'r1', type: 'transfer', amount: 50000, accountId: 'a1', toAccountId: 'a2', categoryId: 'c1', note: null, tag: null, date: '2025-06-01T00:00:00Z', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z' },
			];

			await importBackupFromFile(makeFile(backup));

			const statements = executeSet.mock.calls[0][0];
			// statements: [0] DELETE records, [1] DELETE accounts, [2] DELETE categories,
			//             [3] INSERT account, [4] INSERT category, [5] INSERT record, [6] INSERT settings
			const recordValues = statements[5].values;
			expect(recordValues[4]).toBe('a2'); // toAccountId is index 4 in record values
		});

		it('does not restore safUri or lastSyncAt from backup settings', async () => {
			const executeSet = vi.fn().mockResolvedValue(undefined);
			(getDB as ReturnType<typeof vi.fn>).mockReturnValue({ executeSet });

			const backup = makeValidBackup();
			(backup.settings as any).safUri = 'content://stale-uri';
			(backup.settings as any).lastSyncAt = '2025-01-01T00:00:00Z';

			await importBackupFromFile(makeFile(backup));

			const statements = executeSet.mock.calls[0][0];
			const settingsStatement = statements[statements.length - 1];
			// SQL should NOT contain safUri or lastSyncAt
			expect(settingsStatement.statement).not.toContain('safUri');
			expect(settingsStatement.statement).not.toContain('lastSyncAt');
		});
	});
});
