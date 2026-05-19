import type { AccountType, Currency } from './enums';

export interface Account {
	id: string;
	name: string;
	type: AccountType;
	currency: Currency;
	balance: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export function createAccount(params: {
	name: string;
	type: AccountType;
	currency: Currency;
	balance?: number;
}): Account {
	const now = new Date();
	return {
		id: crypto.randomUUID(),
		name: params.name,
		type: params.type,
		currency: params.currency,
		balance: params.balance ?? 0,
		isActive: true,
		createdAt: now,
		updatedAt: now
	};
}
