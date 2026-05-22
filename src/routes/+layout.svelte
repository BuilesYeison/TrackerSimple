<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { initWorkspace, settingsService, snapshotService, categoryService } from "$lib/presentation/stores/workspace";
	import Sidebar from "$lib/presentation/components/Sidebar.svelte";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import { toast } from "svelte-sonner";

	let { children } = $props();

	let updateAvailable = $state(false);
	let offlineReady = $state(false);
	let checkingOnboarding = $state(true);

	onMount(async () => {
		await initWorkspace();

		const cats = await categoryService.getAll();
		if (cats.length === 0) {
			const restored = await snapshotService.restoreFromOPFS();
			if (restored) {
				toast.success("Datos restaurados desde backup local");
				window.location.reload();
				return;
			}
		}

		const completed = await settingsService.isOnboardingCompleted();
		checkingOnboarding = false;
		if (!completed && $page.url.pathname !== "/onboarding") {
			goto("/onboarding");
			return;
		}

		const { registerSW } = await import("virtual:pwa-register");
		registerSW({
			immediate: true,
			onNeedRefresh() {
				updateAvailable = true;
			},
			onOfflineReady() {
				offlineReady = true;
				setTimeout(() => (offlineReady = false), 4000);
			},
			onRegisteredSW(_swUrl: any, registration: { update: () => any }) {
				setInterval(() => registration?.update(), 60_000);
			},
		});
	});

	function applyUpdate() {
		updateAvailable = false;
		window.location.reload();
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if updateAvailable}
	<div class="fixed top-4 left-4 z-50 flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3">
		<span class="text-sm text-foreground">Nueva versión disponible</span>
		<button class="rounded-lg bg-income px-3 py-1.5 text-sm font-medium text-primary-foreground" onclick={applyUpdate}>Actualizar</button>
	</div>
{/if}

{#if offlineReady}
	<div class="fixed top-4 right-4 z-50 rounded-xl border border-border bg-surface px-4 py-3">
		<span class="text-sm text-foreground">App lista para usar sin conexión</span>
	</div>
{/if}

<div class="flex flex-col h-dvh">
	<main class="flex-1 overflow-auto p-6">
		<Toaster />
		{@render children()}
	</main>
	{#if !$page.url.pathname.startsWith("/onboarding")}
		<Sidebar />
	{/if}
</div>
