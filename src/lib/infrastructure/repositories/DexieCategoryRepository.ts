import type { Category } from '../../domain/entities';
import type { ICategoryRepository } from '../../domain/repositories';
import type { AppDatabase } from '../db';

export class DexieCategoryRepository implements ICategoryRepository {
	constructor(private db: AppDatabase) {}

	async create(category: Category): Promise<void> {
		await this.db.categories.add(category);
	}

	async update(category: Category): Promise<void> {
		await this.db.categories.put(category);
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
}
