import type { Account } from '../../domain/entities';
import type { IAccountRepository } from '../../domain/repositories';
import type { AppDatabase } from '../db';

export class DexieAccountRepository implements IAccountRepository {
	constructor(private db: AppDatabase) {}

	async create(account: Account): Promise<void> {
		await this.db.accounts.add(account);
	}

	async update(account: Account): Promise<void> {
		await this.db.accounts.put(account);
	}

	async findById(id: string): Promise<Account | null> {
		return (await this.db.accounts.get(id)) ?? null;
	}

	async findAll(): Promise<Account[]> {
		return this.db.accounts.toArray();
	}

	async findActive(): Promise<Account[]> {
		const all = await this.findAll();
		return all.filter((a) => a.isActive);
	}
}
