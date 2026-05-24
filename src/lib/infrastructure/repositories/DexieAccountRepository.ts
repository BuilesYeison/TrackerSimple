import type { Account } from '../../domain/entities';
import type { IAccountRepository } from '../../domain/repositories';
import type { AppDatabase } from '../db';
import type { JsonFileStore } from '../storage/json-store';

export class DexieAccountRepository implements IAccountRepository {
	constructor(
		private db: AppDatabase,
		private jsonStore: JsonFileStore,
	) {}

	async create(account: Account): Promise<void> {
		await this.db.accounts.add(account);
		await this.syncToFile();
	}

	async update(account: Account): Promise<void> {
		await this.db.accounts.put(account);
		await this.syncToFile();
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

	async delete(id: string): Promise<void> {
		await this.db.accounts.delete(id);
		await this.syncToFile();
	}

	private async syncToFile(): Promise<void> {
		try {
			const all = await this.db.accounts.toArray();
			await this.jsonStore.saveAccounts(all);
		} catch (err) {
			console.warn('syncToFile accounts failed:', err);
		}
	}
}
