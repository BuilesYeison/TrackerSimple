import type { Record, RecordType } from '../../domain/entities';
import type { AccountBalance, MonthlyAggregate, CategoryTotal } from '../../domain/entities';
import type { IRecordRepository } from '../../domain/repositories';
import { getDB } from '../db/sqlite';
import { toISO, type SqliteRow } from '../db/sqlite-helpers';
import { triggerSync } from '../../application/services/SyncService';

function mapRow(row: SqliteRow): Record {
	return {
		id: row.id as string,
		type: row.type as RecordType,
		amount: Number(row.amount),
		accountId: row.accountId as string,
		toAccountId: (row.toAccountId as string | null) || null,
		categoryId: row.categoryId as string,
		note: (row.note as string | null) || null,
		tag: (row.tag as string | null) || null,
		date: new Date(row.date as string | number),
		createdAt: new Date(row.createdAt as string | number),
		updatedAt: new Date(row.updatedAt as string | number),
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
		triggerSync();
	}

	async update(record: Record): Promise<void> {
		const db = getDB();
		await db.run(
			`UPDATE records SET type = ?, amount = ?, accountId = ?, toAccountId = ?, categoryId = ?, note = ?, tag = ?, date = ?, updatedAt = ? WHERE id = ?`,
			[record.type, record.amount, record.accountId, record.toAccountId, record.categoryId, record.note, record.tag, toISO(record.date), toISO(new Date()), record.id],
		);
		triggerSync();
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
		triggerSync();
	}

	async getBalancesForActiveAccounts(): Promise<AccountBalance[]> {
		const db = getDB();
		const result = await db.query(`
			SELECT
				a.id AS accountId,
				a.balance +
					COALESCE(SUM(CASE WHEN r.type = 'income' AND r.accountId = a.id THEN r.amount ELSE 0 END), 0) -
					COALESCE(SUM(CASE WHEN r.type = 'expense' AND r.accountId = a.id THEN r.amount ELSE 0 END), 0) -
					COALESCE(SUM(CASE WHEN r.type = 'transfer' AND r.accountId = a.id THEN r.amount ELSE 0 END), 0) +
					COALESCE(SUM(CASE WHEN r.type = 'transfer' AND r.toAccountId = a.id THEN r.amount ELSE 0 END), 0) AS balance
			FROM accounts a
			LEFT JOIN records r ON r.accountId = a.id OR r.toAccountId = a.id
			WHERE a.isActive = 1
			GROUP BY a.id
		`);
		return (result.values ?? []).map((row: SqliteRow) => ({
			accountId: row.accountId as string,
			balance: Number(row.balance),
		}));
	}

	async getMonthlyAggregation(from: Date, to: Date): Promise<MonthlyAggregate[]> {
		const db = getDB();
		const result = await db.query(`
			SELECT
				strftime('%Y-%m', date) AS month,
				COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
				COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
			FROM records
			WHERE date >= ? AND date <= ? AND type != 'transfer'
			GROUP BY month
			ORDER BY month ASC
		`, [toISO(from), toISO(to)]);
		return (result.values ?? []).map((row: SqliteRow) => ({
			month: row.month as string,
			income: Number(row.income),
			expense: Number(row.expense),
		}));
	}

	async getCategoryTotals(from: Date, to: Date, type: RecordType): Promise<CategoryTotal[]> {
		const db = getDB();
		const result = await db.query(`
			SELECT categoryId, SUM(amount) AS total
			FROM records
			WHERE type = ? AND date >= ? AND date <= ?
			GROUP BY categoryId
			ORDER BY total DESC
		`, [type, toISO(from), toISO(to)]);
		return (result.values ?? []).map((row: SqliteRow) => ({
			categoryId: row.categoryId as string,
			total: Number(row.total),
		}));
	}
}
