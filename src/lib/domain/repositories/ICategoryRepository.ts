import type { Category } from '../entities';

export interface ICategoryRepository {
	create(category: Category): Promise<void>;
	update(category: Category): Promise<void>;
	delete(id: string): Promise<void>;
	findById(id: string): Promise<Category | null>;
	findAll(): Promise<Category[]>;
	findDefaults(): Promise<Category[]>;
	findByName(name: string): Promise<Category | null>;
	findByNameAndType(name: string, type: string): Promise<Category | null>;
}
