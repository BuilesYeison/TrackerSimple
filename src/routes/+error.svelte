<script lang="ts">
	let { data } = $props();
</script>

<div
	class="flex h-dvh flex-col items-center justify-center gap-6 bg-background p-6 text-center"
>
	<div>
		<h1 class="text-2xl font-bold">Algo salió mal</h1>
		<p class="mt-2 text-sm text-muted">
			Ocurrió un error inesperado. Intentá recargar la aplicación.
		</p>
	</div>
	<button
		onclick={() => window.location.reload()}
		class="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
	>
		Recargar
	</button>
	{#if data.status}
		<div class="text-xs text-muted">
			Error {data.status}: {data.error?.message || ""}
		</div>
	{/if}
</div>
