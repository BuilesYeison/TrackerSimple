import { createAccount, type Account, type AccountType, type Currency } from '../../domain/entities';
import type { IAccountRepository } from '../../domain/repositories';

export class AccountService {
	constructor(private repo: IAccountRepository) {}

	async create(params: {
		name: string;
		type: AccountType;
		currency: Currency;
		balance?: number;
	}): Promise<Account> {
		const account = createAccount(params);
		await this.repo.create(account);
		return account;
	}

	async update(account: Account): Promise<void> {
		await this.repo.update(account);
	}

	async deactivate(id: string): Promise<void> {
		const account = await this.repo.findById(id);
		if (!account) throw new Error('Account not found');
		account.isActive = false;
		account.updatedAt = new Date();
		await this.repo.update(account);
	}

	async delete(id: string): Promise<void> {
		await this.repo.delete(id);
	}

	async getById(id: string): Promise<Account | null> {
		return this.repo.findById(id);
	}

	async getAll(): Promise<Account[]> {
		return this.repo.findAll();
	}

	async getActive(): Promise<Account[]> {
		return this.repo.findActive();
	}
}
