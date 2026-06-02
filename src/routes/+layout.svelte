<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { page } from "$app/stores";
	import Sidebar from "$lib/presentation/components/Sidebar.svelte";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { App } from "@capacitor/app";
	import { initWorkspace } from "$lib/presentation/stores";
	import { reconnectDatabase } from "$lib/presentation/stores/workspace";
	import { onMount } from "svelte";

	let { children } = $props();

	let checkingOnboarding = $state(true);
	let initError = $state("");

	onMount(async () => {
		try {
			await initWorkspace();
			App.addListener("resume", async () => {
				await reconnectDatabase();
			});
		} catch (err) {
			initError =
				err instanceof Error
					? err.message
					: "Error al iniciar la aplicación";
		} finally {
			checkingOnboarding = false;
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if checkingOnboarding && !initError}
	<div class="flex h-dvh items-center justify-center bg-background">
		<div
			class="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground"
		></div>
	</div>
{:else if initError}
	<div
		class="flex h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center"
	>
		<div class="text-sm text-expense">{initError}</div>
		<button
			onclick={() => window.location.reload()}
			class="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
		>
			Reintentar
		</button>
	</div>
{:else}
	<div class="flex flex-col h-dvh">
		<main class="flex-1 overflow-auto p-6 pt-14">
			<Toaster />
			<Tooltip.Provider>
				{@render children()}
			</Tooltip.Provider>
		</main>
		{#if !$page.url.pathname.startsWith("/onboarding")}
			<Sidebar />
		{/if}
	</div>
{/if}
