<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initWorkspace } from '$lib/presentation/stores/workspace';
	import Sidebar from '$lib/presentation/components/Sidebar.svelte';

	let { children } = $props();

	let updateAvailable = $state(false);
	let offlineReady = $state(false);

	onMount(async () => {
		await initWorkspace();

		const { registerSW } = await import('virtual:pwa-register');
		registerSW({
			immediate: true,
			onNeedRefresh() {
				updateAvailable = true;
			},
			onOfflineReady() {
				offlineReady = true;
				setTimeout(() => (offlineReady = false), 4000);
			},
			onRegisteredSW(_swUrl, registration) {
				setInterval(() => registration?.update(), 60_000);
			}
		});
	});

	function applyUpdate() {
		updateAvailable = false;
		window.location.reload();
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if updateAvailable}
	<div class="toast toast-tl toast-success">
		<div class="flex items-center gap-4">
			<span>Nueva versión disponible</span>
			<button class="btn btn-filled-primary btn-sm" onclick={applyUpdate}>Actualizar</button>
		</div>
	</div>
{/if}

{#if offlineReady}
	<div class="toast toast-tr">
		<span>App lista para usar sin conexión</span>
	</div>
{/if}

<div class="flex flex-col h-dvh">
	<main class="flex-1 overflow-auto p-6 pb-20">
		{@render children()}
	</main>
	<Sidebar />
</div>
