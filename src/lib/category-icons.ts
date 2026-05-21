const CATEGORY_EMOJIS: Record<string, string> = {
	'Comida': '🍔',
	'Transporte': '🚌',
	'Salud': '💊',
	'Educación': '📚',
	'Vivienda': '🏠',
	'Automóvil': '🚗',
	'Deportes': '⚽',
	'Entretenimiento': '🎮',
	'Mascotas': '🐾',
	'Regalos': '🎁',
	'Ropa': '👕',
	'Salario': '💼',
	'Depósitos': '💰',
	'Ahorros': '🏦',
};

export function getCategoryEmoji(name: string): string {
	return CATEGORY_EMOJIS[name] ?? '📌';
}
