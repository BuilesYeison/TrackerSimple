<script lang="ts">
	import { page } from "$app/stores";
	import { House, ArrowRightLeft, Wallet, BarChart3, Cog } from "@lucide/svelte";

	const navItems = [
		{ href: "/dashboard", label: "Dashboard", icon: House },
		{ href: "/records", label: "Registros", icon: ArrowRightLeft },
		{ href: "/accounts", label: "Cuentas", icon: Wallet },
		{ href: "/analytics", label: "Analítica", icon: BarChart3 },
		{ href: "/settings", label: "Ajustes", icon: Cog },
	];

	function isActive(href: string) {
		return $page.url.pathname.startsWith(href);
	}
</script>

<nav class="flex h-16 items-center justify-around border-t border-border bg-background">
	{#each navItems as { href, label, icon: Icon } (href)}
		<a
			{href}
			class="flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors {isActive(href)
				? 'text-income'
				: 'text-muted hover:text-foreground'}"
		>
			<Icon class="size-5" />
			<span>{label}</span>
		</a>
	{/each}
</nav>
