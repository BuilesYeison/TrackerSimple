<script lang="ts">
	import { page } from "$app/stores";
	import {
		House,
		ArrowRightLeft,
		Wallet,
		BarChart3,
		Cog,
	} from "@lucide/svelte";
	import { Navigation } from "@skeletonlabs/skeleton-svelte";

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

<Navigation layout="bar">
	<Navigation.Menu class="grid grid-cols-5 gap-2">
		{#each navItems as { href, label, icon: Icon } (href)}
			<Navigation.TriggerAnchor
				{href}
				class={isActive(href) ? "preset-filled-primary-500" : ""}
			>
				<Icon class="size-5" />
				<Navigation.TriggerText>{label}</Navigation.TriggerText>
			</Navigation.TriggerAnchor>
		{/each}
	</Navigation.Menu>
</Navigation>
