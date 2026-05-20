import { DEFAULT_ACCOUNTS } from '$lib/domain/entities/default-accounts';
import { createAccount, createCategory, DEFAULT_CATEGORIES } from '../../domain/entities';
import type { AppDatabase } from './database';

export async function seedDefaultCategories(db: AppDatabase): Promise<void> {
	const count = await db.categories.count();
	if (count > 0) return;

	const categories = DEFAULT_CATEGORIES.map((def) =>
		createCategory({ name: def.name, type: def.type, isDefault: true })
	);

	await db.categories.bulkAdd(categories);
}

export async function seedDefaultAccounts(db: AppDatabase): Promise<void> {
	const count = await db.accounts.count();
	if (count > 0) return;

	const accounts = DEFAULT_ACCOUNTS.map((def) =>
		createAccount({ name: def.name, type: def.type, currency: def.currency, balance: 0 })
	)

	await db.accounts.bulkAdd(accounts)
}