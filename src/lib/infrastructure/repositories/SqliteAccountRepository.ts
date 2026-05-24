import type { Account } from '../../domain/entities';
import type { IAccountRepository } from '../../domain/repositories';
import { getDB } from '../db/sqlite';

function toISO(d: Date): string {
	return d.toISOString();
}

function mapRow(row: any): Account {
	return {
		id: row.id,
		name: row.name,
		type: row.type,
		currency: row.currency,
		balance: Number(row.balance),
		isActive: Boolean(row.isActive),
		createdAt: new Date(row.createdAt),
		updatedAt: new Date(row.updatedAt),
	};
}

export class SqliteAccountRepository implements IAccountRepository {
	async create(account: Account): Promise<void> {
		const db = getDB();
		await db.run(
			`INSERT INTO accounts (id, name, type, currency, balance, isActive, createdAt, updatedAt)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[account.id, account.name, account.type, account.currency, account.balance, 1, toISO(account.createdAt), toISO(account.updatedAt)],
		);
	}

	async update(account: Account): Promise<void> {
		const db = getDB();
		await db.run(
			`UPDATE accounts SET name = ?, type = ?, currency = ?, balance = ?, isActive = ?, updatedAt = ? WHERE id = ?`,
			[account.name, account.type, account.currency, account.balance, account.isActive ? 1 : 0, toISO(new Date()), account.id],
		);
	}

	async findById(id: string): Promise<Account | null> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM accounts WHERE id = ?`, [id]);
		return result.values?.[0] ? mapRow(result.values[0]) : null;
	}

	async findAll(): Promise<Account[]> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM accounts`);
		return (result.values ?? []).map(mapRow);
	}

	async findActive(): Promise<Account[]> {
		const db = getDB();
		const result = await db.query(`SELECT * FROM accounts WHERE isActive = 1`);
		return (result.values ?? []).map(mapRow);
	}

	async delete(id: string): Promise<void> {
		const db = getDB();
		await db.run(`DELETE FROM accounts WHERE id = ?`, [id]);
	}
}
