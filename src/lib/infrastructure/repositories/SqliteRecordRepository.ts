import type { Record } from '../../domain/entities';
import type { IRecordRepository } from '../../domain/repositories';
import { getDB } from '../db/sqlite';

function toISO(d: Date): string {
	return d.toISOString();
}

function mapRow(row: any): Record {
	return {
		id: row.id,
		type: row.type,
		amount: Number(row.amount),
		accountId: row.accountId,
		toAccountId: row.toAccountId || null,
		categoryId: row.categoryId,
		note: row.note || null,
		tag: row.tag || null,
		date: new Date(row.date),
		createdAt: new Date(row.createdAt),
		updatedAt: new Date(row.updatedAt),
	};
}

export class SqliteRecordRepository implements IRecordRepository {
	async create(record: Record): Promise<void> {
		const db = getDB();
		await db.run(
			`INSERT INTO records (id, type, amount, accountId, toAccountId, categoryId, note, tag, date, createdAt, updatedAt)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[record.id, record.type, record.amount, record.accountId, record.toAccountId, record.categoryId, record.note, record.tag, toISO(record.date), toISO(record.createdAt), toISO(record.updatedAt)],
		);
	}

	async update(record: Record): Promise<void> {
		const db = getDB();
		await db.run(
			`UPDATE records SET type = ?, amount = ?, accountId = ?, toAccountId = ?, categoryId = ?, note = ?, tag = ?, date = ?, updatedAt = ? WHERE id = ?`,
			[record.type, record.amount, record.accountId, record.toAccountId, record.categoryId, record.note, record.tag, toISO(record.date), toISO(new Date()), record.id],
		);
	}

	async findById(id: string): Promise<Record | null> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM records WHERE id = ?`, [id]);
		return result.values?.[0] ? mapRow(result.values[0]) : null;
	}

	async findByAccount(accountId: string): Promise<Record[]> {
		const db = getDB();
		const result = await db.query(
			`SELECT * FROM records WHERE accountId = ? OR toAccountId = ? ORDER BY date DESC`,
			[accountId, accountId],
		);
		return (result.values ?? []).map(mapRow);
	}

	async findByCategory(categoryId: string): Promise<Record[]> {
		const db = getDB();
		const result = await db.query(
			`SELECT * FROM records WHERE categoryId = ? ORDER BY date DESC`,
			[categoryId],
		);
		return (result.values ?? []).map(mapRow);
	}

	async findByDateRange(from: Date, to: Date): Promise<Record[]> {
		const db = getDB();
		const result = await db.query(
			`SELECT * FROM records WHERE date >= ? AND date <= ? ORDER BY date DESC`,
			[toISO(from), toISO(to)],
		);
		return (result.values ?? []).map(mapRow);
	}

	async findAll(): Promise<Record[]> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM records ORDER BY date DESC`);
		return (result.values ?? []).map(mapRow);
	}

	async delete(id: string): Promise<void> {
		const db = getDB();
		await db.run(`DELETE FROM records WHERE id = ?`, [id]);
	}
}
