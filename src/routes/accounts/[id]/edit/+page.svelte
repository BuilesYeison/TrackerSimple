<script lang="ts">
	import { ArrowLeft } from "@lucide/svelte";
</script>

<div class="mx-auto flex max-w-md flex-col gap-4 p-4">
	<header class="flex items-center gap-3">
		<button
			onclick={() => history.back()}
			class="rounded-lg p-2 text-foreground hover:bg-surface-raised transition-colors"
			aria-label="Atrás"
		>
			<ArrowLeft size={22} />
		</button>
		<h1 class="text-2xl font-bold">Editar cuenta</h1>
	</header>
	<div class="flex flex-col items-center gap-2 py-12 text-muted">
		<span class="text-4xl">🚧</span>
		<span>Próximamente</span>
	</div>
</div>
