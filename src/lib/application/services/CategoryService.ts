import {
	createCategory,
	type Category,
	type CategoryType
} from '../../domain/entities';
import type { ICategoryRepository } from '../../domain/repositories';

export class CategoryService {
	constructor(private repo: ICategoryRepository) {}

	async create(params: { name: string; type: CategoryType }): Promise<Category> {
		const existing = await this.repo.findByName(params.name);
		if (existing) throw new Error(`Category "${params.name}" already exists`);

		const category = createCategory({ name: params.name, type: params.type });
		await this.repo.create(category);
		return category;
	}

	async getAll(): Promise<Category[]> {
		return this.repo.findAll();
	}

	async getDefaults(): Promise<Category[]> {
		return this.repo.findDefaults();
	}
}
