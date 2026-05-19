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
	return {
		id: crypto.randomUUID(),
		name: params.name,
		type: params.type,
		isDefault: params.isDefault ?? false,
		createdAt: now,
		updatedAt: now
	};
}
