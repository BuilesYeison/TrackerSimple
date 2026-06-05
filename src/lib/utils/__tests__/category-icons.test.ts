import { describe, it, expect } from 'vitest';
import { getCategoryIcon } from '../category-icons';

describe('getCategoryIcon', () => {
	it('returns an icon for known categories', () => {
		const known = ['Comida', 'Transporte', 'Salud', 'Educación', 'Salario', 'Ahorros'];
		for (const name of known) {
			const icon = getCategoryIcon(name);
			expect(icon).toBeDefined();
		}
	});

	it('returns fallback Circle icon for unknown names', () => {
		const icon = getCategoryIcon('Categoría que no existe');
		expect(icon).toBeDefined();
	});

	it('returns fallback for empty string', () => {
		const icon = getCategoryIcon('');
		expect(icon).toBeDefined();
	});

	it('all 14 default categories have an icon', () => {
		const defaults = [
			'Comida', 'Transporte', 'Salud', 'Educación', 'Vivienda',
			'Automóvil', 'Deportes', 'Entretenimiento', 'Mascotas',
			'Regalos', 'Ropa', 'Salario', 'Depósitos', 'Ahorros',
		];
		for (const name of defaults) {
			const icon = getCategoryIcon(name);
			expect(icon, `Category "${name}" should have an icon`).toBeDefined();
		}
	});

	it('does not throw for any string input', () => {
		const inputs = ['', ' ', 'abc123', 'Con acentos y ñ'];
		for (const input of inputs) {
			expect(() => getCategoryIcon(input)).not.toThrow();
		}
	});
});
