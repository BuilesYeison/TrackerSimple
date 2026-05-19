<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";

	let { children } = $props();

	let updateAvailable = $state(false);
	let offlineReady = $state(false);

	onMount(() => {
		// import estático resuelto en build, más confiable
		import("virtual:pwa-register").then(({ registerSW }) => {
			registerSW({
				immediate: true, // fuerza registro inmediato
				onNeedRefresh() {
					updateAvailable = true;
				},
				onOfflineReady() {
					offlineReady = true;
					setTimeout(() => (offlineReady = false), 4000);
				},
				onRegisteredSW(swUrl, registration) {
					// polling cada 60s para detectar actualizaciones
					setInterval(() => registration?.update(), 60_000);
				},
			});
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
			<button class="btn btn-filled-primary btn-sm" onclick={applyUpdate}
				>Actualizar</button
			>
		</div>
	</div>
{/if}

{#if offlineReady}
	<div class="toast toast-tr">
		<span>App lista para usar sin conexión</span>
	</div>
{/if}

{@render children()}
