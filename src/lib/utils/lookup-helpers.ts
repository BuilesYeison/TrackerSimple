import type { Account, Category } from "$lib/domain/entities";

export function lookupAccount(accounts: Account[], id: string): string {
	return accounts.find((a) => a.id === id)?.name ?? "—";
}

export function lookupCategory(categories: Category[], id: string): string {
	return categories.find((c) => c.id === id)?.name ?? "—";
}
