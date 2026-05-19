import type { Account } from '../entities';

export interface IAccountRepository {
	create(account: Account): Promise<void>;
	update(account: Account): Promise<void>;
	findById(id: string): Promise<Account | null>;
	findAll(): Promise<Account[]>;
	findActive(): Promise<Account[]>;
}
