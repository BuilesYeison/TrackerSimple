import type { CategoryType } from './Category';

export interface DefaultCategoryDef {
	name: string;
	type: CategoryType;
}

export const DEFAULT_CATEGORIES: DefaultCategoryDef[] = [
	{ name: 'Comida', type: 'expense' },
	{ name: 'Transporte', type: 'expense' },
	{ name: 'Salud', type: 'expense' },
	{ name: 'Educación', type: 'expense' },
	{ name: 'Vivienda', type: 'expense' },
	{ name: 'Automóvil', type: 'expense' },
	{ name: 'Deportes', type: 'expense' },
	{ name: 'Entretenimiento', type: 'expense' },
	{ name: 'Mascotas', type: 'expense' },
	{ name: 'Regalos', type: 'expense' },
	{ name: 'Ropa', type: 'expense' },
	{ name: 'Salario', type: 'income' },
	{ name: 'Depósitos', type: 'income' },
	{ name: 'Ahorros', type: 'income' }
];
