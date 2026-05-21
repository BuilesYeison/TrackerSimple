<script lang="ts">
	import { ArrowLeft } from "@lucide/svelte";
	import AccountForm from "$lib/presentation/components/AccountForm.svelte";
</script>

<div class="mx-auto flex max-w-md flex-col gap-6">
	<header class="flex items-center gap-3">
		<button
			onclick={() => history.back()}
			class="rounded-lg p-2 text-foreground hover:bg-surface-raised transition-colors"
			aria-label="Atrás"
		>
			<ArrowLeft size={22} />
		</button>
		<h1 class="text-2xl font-bold">Crear cuenta</h1>
	</header>
	<AccountForm mode="create" />
</div>
