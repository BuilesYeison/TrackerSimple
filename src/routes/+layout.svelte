<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { initWorkspace, settingsService } from "$lib/presentation/stores/workspace";
	import Sidebar from "$lib/presentation/components/Sidebar.svelte";
	import { Toaster } from "$lib/components/ui/sonner/index.js";

	let { children } = $props();

	let checkingOnboarding = $state(true);

	onMount(async () => {
		await initWorkspace();

		const completed = await settingsService.isOnboardingCompleted();
		checkingOnboarding = false;
		if (!completed && $page.url.pathname !== "/onboarding") {
			goto("/onboarding");
			return;
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex flex-col h-dvh">
	<main class="flex-1 overflow-auto p-6">
		<Toaster />
		{@render children()}
	</main>
	{#if !$page.url.pathname.startsWith("/onboarding")}
		<Sidebar />
	{/if}
</div>
