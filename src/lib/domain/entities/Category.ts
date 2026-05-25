import { v4 as uuidv4 } from 'uuid';

export type CategoryType = 'expense' | 'income';

export interface Category {
	id: string;
	name: string;
	type: CategoryType;
	isDefault: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export function createCategory(params: {
	name: string;
	type: CategoryType;
	isDefault?: boolean;
}): Category {
	const now = new Date();
	let id = uuidv4()
	if (typeof crypto === "object" && crypto.randomUUID) {
		id = crypto.randomUUID()
	}
	return {
		id: id,
		name: params.name,
		type: params.type,
		isDefault: params.isDefault ?? false,
		createdAt: now,
		updatedAt: now
	};
}
