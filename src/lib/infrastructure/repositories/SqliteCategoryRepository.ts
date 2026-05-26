import type { Category, CategoryType } from '../../domain/entities';
import type { ICategoryRepository } from '../../domain/repositories';
import { getDB } from '../db/sqlite';
import { toISO, type SqliteRow } from '../db/sqlite-helpers';
import { triggerSync } from '../../application/services/SyncService';

function mapRow(row: SqliteRow): Category {
	return {
		id: row.id as string,
		name: row.name as string,
		type: row.type as CategoryType,
		isDefault: Boolean(row.isDefault),
		createdAt: new Date(row.createdAt as string | number),
		updatedAt: new Date(row.updatedAt as string | number),
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
		triggerSync();
	}

	async update(category: Category): Promise<void> {
		const db = getDB();
		await db.run(
			`UPDATE categories SET name = ?, type = ?, isDefault = ?, updatedAt = ? WHERE id = ?`,
			[category.name, category.type, category.isDefault ? 1 : 0, toISO(new Date()), category.id],
		);
		triggerSync();
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
