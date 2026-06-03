<script lang="ts">
	import { Info } from "@lucide/svelte";

	let {
		liquidBalance,
		netBalance,
		currency,
	}: {
		liquidBalance: number;
		netBalance: number;
		currency: string;
	} = $props();

	let liquidOpen = $state(false);
	let netOpen = $state(false);

	function toggleLiquid(e: MouseEvent) {
		e.stopPropagation();
		netOpen = false;
		liquidOpen = !liquidOpen;
	}

	function toggleNet(e: MouseEvent) {
		e.stopPropagation();
		liquidOpen = false;
		netOpen = !netOpen;
	}

	function closeAll() {
		liquidOpen = false;
		netOpen = false;
	}

	const liquidSign = $derived(liquidBalance >= 0 ? "+" : "-");
	const liquidColor = $derived(
		liquidBalance >= 0 ? "text-income" : "text-expense",
	);
	const liquidDisplay = $derived(
		`${liquidSign}$${Math.abs(liquidBalance).toLocaleString("es")}`,
	);

	const netSign = $derived(netBalance >= 0 ? "+" : "-");
	const netColor = $derived(
		netBalance >= 0 ? "text-income" : "text-expense",
	);
	const netDisplay = $derived(
		`${netSign}$${Math.abs(netBalance).toLocaleString("es")}`,
	);

	const tooltipOpen = $derived(liquidOpen || netOpen);
</script>

{#if tooltipOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40" onclick={closeAll}></div>
{/if}

<div class="text-center py-6 flex flex-col gap-4">
	<div>
		<div class="text-4xl font-light {liquidColor}">{liquidDisplay}</div>
		<div class="mt-1 flex items-center justify-center gap-1 text-xs text-muted">
			balance líquido
			<div class="relative">
				<button
					onclick={toggleLiquid}
					class="hover:text-foreground transition-colors"
				>
					<Info size={12} class="text-muted" />
				</button>
				{#if liquidOpen}
					<div
						class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-56 rounded-md bg-foreground px-3 py-2 text-xs text-background"
					>
						El balance líquido incluye cuentas de efectivo y débito. No incluye crédito ni deuda.
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div>
		<div class="text-2xl font-light {netColor} opacity-70">{netDisplay}</div>
		<div class="mt-1 flex items-center justify-center gap-1 text-xs text-muted">
			balance neto
			<div class="relative">
				<button
					onclick={toggleNet}
					class="hover:text-foreground transition-colors"
				>
					<Info size={12} class="text-muted" />
				</button>
				{#if netOpen}
					<div
						class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-56 rounded-md bg-foreground px-3 py-2 text-xs text-background"
					>
						El balance neto incluye todas tus cuentas: efectivo, débito y crédito/deuda.
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
