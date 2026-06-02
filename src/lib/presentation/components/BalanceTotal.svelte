<script lang="ts">
	import { Info } from "@lucide/svelte";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	let {
		liquidBalance,
		netBalance,
		currency,
	}: {
		liquidBalance: number;
		netBalance: number;
		currency: string;
	} = $props();

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
</script>

<div class="text-center py-6 flex flex-col gap-4">
	<div>
		<div class="text-4xl font-light {liquidColor}">{liquidDisplay}</div>
		<div class="mt-1 flex items-center justify-center gap-1 text-xs text-muted">
			balance líquido
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Info size={12} class="cursor-pointer text-muted hover:text-foreground transition-colors" />
				</Tooltip.Trigger>
				<Tooltip.Content side="bottom">
					<p>El balance líquido incluye cuentas de efectivo y débito. No incluye crédito ni deuda.</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>

	<div>
		<div class="text-2xl font-light {netColor} opacity-70">{netDisplay}</div>
		<div class="mt-1 flex items-center justify-center gap-1 text-xs text-muted">
			balance neto
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Info size={12} class="cursor-pointer text-muted hover:text-foreground transition-colors" />
				</Tooltip.Trigger>
				<Tooltip.Content side="bottom">
					<p>El balance neto incluye todas tus cuentas: efectivo, débito y crédito/deuda.</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>
</div>
