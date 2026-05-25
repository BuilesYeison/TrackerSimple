import type { Account, AccountType, Currency } from '../../domain/entities';
import type { IAccountRepository } from '../../domain/repositories';
import { getDB } from '../db/sqlite';
import { toISO, type SqliteRow } from '../db/sqlite-helpers';

function mapRow(row: SqliteRow): Account {
	const typedRow = row as Record<string, unknown>;
	return {
		id: typedRow.id as string,
		name: typedRow.name as string,
		type: typedRow.type as AccountType,
		currency: typedRow.currency as Currency,
		balance: Number(typedRow.balance),
		isActive: Boolean(typedRow.isActive),
		createdAt: new Date(typedRow.createdAt as string | number),
		updatedAt: new Date(typedRow.updatedAt as string | number),
	};
}

export class SqliteAccountRepository implements IAccountRepository {
	async create(account: Account): Promise<void> {
		const db = getDB();
		await db.run(
			`INSERT INTO accounts (id, name, type, currency, balance, isActive, createdAt, updatedAt)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[account.id, account.name, account.type, account.currency, account.balance, account.isActive ? 1 : 0, toISO(account.createdAt), toISO(account.updatedAt)],
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
