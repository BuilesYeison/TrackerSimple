import type { RecordType } from './enums';

export interface Record {
	id: string;
	type: RecordType;
	amount: number;
	accountId: string;
	toAccountId: string | null;
	categoryId: string;
	note: string | null;
	tag: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export function createRecord(params: {
	type: RecordType;
	amount: number;
	accountId: string;
	toAccountId?: string | null;
	categoryId: string;
	note?: string | null;
	tag?: string | null;
}): Record {
	const now = new Date();
	return {
		id: crypto.randomUUID(),
		type: params.type,
		amount: params.amount,
		accountId: params.accountId,
		toAccountId: params.toAccountId ?? null,
		categoryId: params.categoryId,
		note: params.note ?? null,
		tag: params.tag ?? null,
		createdAt: now,
		updatedAt: now
	};
}
