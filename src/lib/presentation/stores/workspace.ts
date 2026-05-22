import { getDb, seedDefaultCategories } from '../../infrastructure/db';
import { DexieAccountRepository, DexieCategoryRepository, DexieRecordRepository, DexieAppSettingsRepository } from '../../infrastructure/repositories';
import { AccountService, CategoryService, RecordService, SettingsService } from '../../application/services';
import { SnapshotService } from '../../application/services/SnapshotService';

const db = getDb();

const accountRepo = new DexieAccountRepository(db);
const categoryRepo = new DexieCategoryRepository(db);
const recordRepo = new DexieRecordRepository(db);
const settingsRepo = new DexieAppSettingsRepository(db);

export const accountService = new AccountService(accountRepo);
export const categoryService = new CategoryService(categoryRepo);
export const recordService = new RecordService(recordRepo);
export const settingsService = new SettingsService(settingsRepo);
export const snapshotService = new SnapshotService();

let ready = false;
let resolveReady: () => void;
export const workspaceReady = new Promise<void>((r) => {
	resolveReady = r;
});

export async function initWorkspace(): Promise<void> {
	if (ready) return;
	await seedDefaultCategories(db);
	await seedDefaultSettings(db);
	ready = true;
	resolveReady();
}

async function seedDefaultSettings(db: AppDatabase): Promise<void> {
	const existing = await db.settings.get('default');
	if (!existing) {
		await db.settings.put({ key: 'default', currency: 'COP' });
	}
}

export function isReady(): boolean {
	return ready;
}
