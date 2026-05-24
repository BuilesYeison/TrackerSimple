import type { Category } from '../../domain/entities';
import type { ICategoryRepository } from '../../domain/repositories';
import { getDB } from '../db/sqlite';

function toISO(d: Date): string {
	return d.toISOString();
}

function mapRow(row: any): Category {
	return {
		id: row.id,
		name: row.name,
		type: row.type,
		isDefault: Boolean(row.isDefault),
		createdAt: new Date(row.createdAt),
		updatedAt: new Date(row.updatedAt),
	};
}

export class SqliteCategoryRepository implements ICategoryRepository {
	async create(category: Category): Promise<void> {
		const db = getDB();
		await db.run(
			`INSERT INTO categories (id, name, type, isDefault, createdAt, updatedAt)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[category.id, category.name, category.type, category.isDefault ? 1 : 0, toISO(category.createdAt), toISO(category.updatedAt)],
		);
	}

	async update(category: Category): Promise<void> {
		const db = getDB();
		await db.run(
			`UPDATE categories SET name = ?, type = ?, isDefault = ?, updatedAt = ? WHERE id = ?`,
			[category.name, category.type, category.isDefault ? 1 : 0, toISO(new Date()), category.id],
		);
	}

	async findById(id: string): Promise<Category | null> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM categories WHERE id = ?`, [id]);
		return result.values?.[0] ? mapRow(result.values[0]) : null;
	}

	async findAll(): Promise<Category[]> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM categories`);
		return (result.values ?? []).map(mapRow);
	}

	async findDefaults(): Promise<Category[]> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM categories WHERE isDefault = 1`);
		return (result.values ?? []).map(mapRow);
	}

	async findByName(name: string): Promise<Category | null> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM categories WHERE name = ?`, [name]);
		return result.values?.[0] ? mapRow(result.values[0]) : null;
	}
}
