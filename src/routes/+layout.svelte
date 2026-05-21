<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { initWorkspace } from "$lib/presentation/stores/workspace";
	import Sidebar from "$lib/presentation/components/Sidebar.svelte";
	import { Toaster } from "$lib/components/ui/sonner/index.js";

	let { children } = $props();

	let updateAvailable = $state(false);
	let offlineReady = $state(false);

	onMount(async () => {
		await initWorkspace();

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
	<div class="fixed top-4 left-4 z-50 flex items-center gap-4 rounded-xl border border-[#141414] bg-[#111] px-4 py-3">
		<span class="text-sm text-[#fafafa]">Nueva versión disponible</span>
		<button class="rounded-lg bg-[#4ade80] px-3 py-1.5 text-sm font-medium text-[#0a0a0a]" onclick={applyUpdate}>Actualizar</button>
	</div>
{/if}

{#if offlineReady}
	<div class="fixed top-4 right-4 z-50 rounded-xl border border-[#141414] bg-[#111] px-4 py-3">
		<span class="text-sm text-[#fafafa]">App lista para usar sin conexión</span>
	</div>
{/if}

<div class="flex flex-col h-dvh">
	<main class="flex-1 overflow-auto p-6">
		<Toaster />
		{@render children()}
	</main>
	<Sidebar />
</div>
