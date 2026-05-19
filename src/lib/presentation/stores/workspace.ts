import { getDb, seedDefaultCategories } from '../../infrastructure/db';
import { DexieAccountRepository, DexieCategoryRepository, DexieRecordRepository } from '../../infrastructure/repositories';
import { AccountService, CategoryService, RecordService } from '../../application/services';

const db = getDb();

const accountRepo = new DexieAccountRepository(db);
const categoryRepo = new DexieCategoryRepository(db);
const recordRepo = new DexieRecordRepository(db);

export const accountService = new AccountService(accountRepo);
export const categoryService = new CategoryService(categoryRepo);
export const recordService = new RecordService(recordRepo);

let ready = false;

export async function initWorkspace(): Promise<void> {
	if (ready) return;
	await seedDefaultCategories(db);
	ready = true;
}

export function isReady(): boolean {
	return ready;
}
