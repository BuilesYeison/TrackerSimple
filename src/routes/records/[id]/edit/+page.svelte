<script lang="ts">
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import { ArrowLeft } from "@lucide/svelte";
	import {
		recordService,
		workspaceReady,
	} from "$lib/presentation/stores/workspace";
	import RecordForm from "$lib/presentation/components/RecordForm.svelte";
	import type { Record } from "$lib/domain/entities";

	let record = $state<Record | null>(null);
	let loading = $state(true);

	onMount(async () => {
		await workspaceReady;
		record = await recordService.getById($page.params.id!);
		loading = false;
	});
</script>

<div class="flex h-full max-w-md flex-col">
	{#if loading}
		<div class="h-40 animate-pulse rounded-xl bg-surface mx-4"></div>
	{:else if !record}
		<div class="flex flex-col items-center gap-2 py-12 text-muted">
			<span>Registro no encontrado</span>
		</div>
	{:else}
		<RecordForm mode="edit" {record} />
	{/if}
</div>
