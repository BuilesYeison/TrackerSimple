<script lang="ts">
	import ThemeToggle from '$lib/presentation/components/ThemeToggle.svelte';
</script>

<div class="flex flex-col gap-4">
	<h1 class="h1">Ajustes</h1>
	<div class="flex items-center justify-between rounded-2xl border border-surface-200-800 p-4">
		<span>Modo oscuro</span>
		<ThemeToggle />
	</div>
</div>
