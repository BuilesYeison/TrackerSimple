import type { AccountType, Currency } from './enums';
import { v4 as uuidv4 } from 'uuid'

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
	let id = uuidv4()
	if (typeof crypto === "object" && crypto.randomUUID) {
		id = crypto.randomUUID()
	}
	return {
		id: id,
		name: params.name,
		type: params.type,
		currency: params.currency,
		balance: params.balance ?? 0,
		isActive: true,
		createdAt: now,
		updatedAt: now
	};
}
