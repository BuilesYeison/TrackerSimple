import Dexie, { type EntityTable } from 'dexie';
import type { Account, Category, Record } from '../../domain/entities';

export class AppDatabase extends Dexie {
	accounts!: EntityTable<Account, 'id'>;
	categories!: EntityTable<Category, 'id'>;
	records!: EntityTable<Record, 'id'>;

	constructor() {
		super('PersonalFinAppV2');
		this.version(1).stores({
			accounts: 'id, name, type, currency, isActive',
			categories: 'id, &name, type, isDefault',
			records: 'id, type, accountId, toAccountId, categoryId, createdAt'
		});
	}
}

let dbInstance: AppDatabase | null = null;

export function getDb(): AppDatabase {
	if (!dbInstance) {
		dbInstance = new AppDatabase();
	}
	return dbInstance;
}
