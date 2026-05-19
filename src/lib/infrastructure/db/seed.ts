import { createCategory, DEFAULT_CATEGORIES } from '../../domain/entities';
import type { AppDatabase } from './database';

export async function seedDefaultCategories(db: AppDatabase): Promise<void> {
	const count = await db.categories.count();
	if (count > 0) return;

	const categories = DEFAULT_CATEGORIES.map((def) =>
		createCategory({ name: def.name, type: def.type, isDefault: true })
	);

	await db.categories.bulkAdd(categories);
}
