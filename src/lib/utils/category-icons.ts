import type { Component } from "svelte";
import ArrowDownToLine from "@lucide/svelte/icons/arrow-down-to-line";
import Banknote from "@lucide/svelte/icons/banknote";
import Bus from "@lucide/svelte/icons/bus";
import Car from "@lucide/svelte/icons/car";
import Circle from "@lucide/svelte/icons/circle";
import Gamepad2 from "@lucide/svelte/icons/gamepad-2";
import Gift from "@lucide/svelte/icons/gift";
import GraduationCap from "@lucide/svelte/icons/graduation-cap";
import Heart from "@lucide/svelte/icons/heart";
import HeartPulse from "@lucide/svelte/icons/heart-pulse";
import Home from "@lucide/svelte/icons/home";
import PiggyBank from "@lucide/svelte/icons/piggy-bank";
import Shirt from "@lucide/svelte/icons/shirt";
import Trophy from "@lucide/svelte/icons/trophy";
import Utensils from "@lucide/svelte/icons/utensils";

const CATEGORY_ICONS: Record<string, Component> = {
	Comida: Utensils,
	Transporte: Bus,
	Salud: HeartPulse,
	Educación: GraduationCap,
	Vivienda: Home,
	Automóvil: Car,
	Deportes: Trophy,
	Entretenimiento: Gamepad2,
	Mascotas: Heart,
	Regalos: Gift,
	Ropa: Shirt,
	Salario: Banknote,
	Depósitos: ArrowDownToLine,
	Ahorros: PiggyBank,
};

export function getCategoryIcon(name: string): Component {
	return CATEGORY_ICONS[name] ?? Circle;
}
