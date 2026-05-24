import type { Category } from '../../domain/entities';
import type { ICategoryRepository } from '../../domain/repositories';
import type { AppDatabase } from '../db';
import type { JsonFileStore } from '../storage/json-store';

export class DexieCategoryRepository implements ICategoryRepository {
	constructor(
		private db: AppDatabase,
		private jsonStore: JsonFileStore,
	) {}

	async create(category: Category): Promise<void> {
		await this.db.categories.add(category);
		await this.syncToFile();
	}

	async update(category: Category): Promise<void> {
		await this.db.categories.put(category);
		await this.syncToFile();
	}

	async findById(id: string): Promise<Category | null> {
		return (await this.db.categories.get(id)) ?? null;
	}

	async findAll(): Promise<Category[]> {
		return this.db.categories.toArray();
	}

	async findDefaults(): Promise<Category[]> {
		const all = await this.findAll();
		return all.filter((c) => c.isDefault);
	}

	async findByName(name: string): Promise<Category | null> {
		return (await this.db.categories.where('name').equals(name).first()) ?? null;
	}

	private async syncToFile(): Promise<void> {
		try {
			const all = await this.db.categories.toArray();
			await this.jsonStore.saveCategories(all);
		} catch (err) {
			console.warn('syncToFile categories failed:', err);
		}
	}
}
