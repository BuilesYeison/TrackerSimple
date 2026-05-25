import { getDB, initDatabase } from '../../infrastructure/db/sqlite';
import { SqliteAccountRepository, SqliteCategoryRepository, SqliteRecordRepository, SqliteAppSettingsRepository } from '../../infrastructure/repositories';
import { AccountService, CategoryService, RecordService, SettingsService } from '../../application/services';
import { createCategory, DEFAULT_CATEGORIES } from '../../domain/entities';

const accountRepo = new SqliteAccountRepository();
const categoryRepo = new SqliteCategoryRepository();
const recordRepo = new SqliteRecordRepository();
const settingsRepo = new SqliteAppSettingsRepository();

export const accountService = new AccountService(accountRepo);
export const categoryService = new CategoryService(categoryRepo);
export const recordService = new RecordService(recordRepo);
export const settingsService = new SettingsService(settingsRepo);

let ready = false;
let resolveReady: () => void;
export const workspaceReady = new Promise<void>((r) => {
	resolveReady = r;
});

export async function initWorkspace(): Promise<void> {
	if (ready) return;

	await initDatabase();

	const cats = await categoryRepo.findAll();
	if (cats.length === 0) {
		const categories = DEFAULT_CATEGORIES.map((def) =>
			createCategory({ name: def.name, type: def.type, isDefault: true }),
		);
		for (const cat of categories) {
			await categoryRepo.create(cat);
		}
	}

	ready = true;
	resolveReady();
}

export async function reconnectDatabase(): Promise<void> {
	try {
		const db = getDB();
		if (!(await db.isDBOpen()).result) {
			await initDatabase();
		}
	} catch {
		await initDatabase();
	}
}
