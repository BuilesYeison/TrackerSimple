import {
	createCategory,
	type Category,
	type CategoryType
} from '../../domain/entities';
import type { ICategoryRepository } from '../../domain/repositories';

export class CategoryService {
	constructor(private repo: ICategoryRepository) {}

	async create(params: { name: string; type: CategoryType }): Promise<Category> {
		const existing = await this.repo.findByNameAndType(params.name, params.type);
		if (existing) throw new Error(`Ya existe una categoría "${params.name}" en ese tipo`);

		const category = createCategory({ name: params.name, type: params.type });
		await this.repo.create(category);
		return category;
	}

	async update(category: Category): Promise<void> {
		const existing = await this.repo.findByNameAndType(category.name, category.type);
		if (existing && existing.id !== category.id) {
			throw new Error(`Ya existe una categoría "${category.name}" en ese tipo`);
		}
		category.updatedAt = new Date();
		await this.repo.update(category);
	}

	async delete(id: string): Promise<void> {
		await this.repo.delete(id);
	}

	async getById(id: string): Promise<Category | null> {
		return this.repo.findById(id);
	}

	async getAll(): Promise<Category[]> {
		return this.repo.findAll();
	}

	async getDefaults(): Promise<Category[]> {
		return this.repo.findDefaults();
	}
}
