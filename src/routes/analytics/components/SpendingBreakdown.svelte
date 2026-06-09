<script lang="ts">
	import type { DonutSlice } from '../helpers';

	let {
		slices,
	}: {
		slices: DonutSlice[];
	} = $props();

	const R = 40;
	const INNER_R = 24;
	const CX = 50;
	const CY = 50;
	const circumference = $derived(2 * Math.PI * R);

	const donutSlices = $derived.by(() => {
		let offset = 0;
		return slices.map((s) => {
			const len = (s.percent / 100) * circumference;
			const dashArray = `${len} ${circumference - len}`;
			const dashOffset = -offset;
			offset += len;
			return { ...s, dashArray, dashOffset };
		});
	});
</script>

<div class="rounded-xl bg-surface p-4">
	<h3 class="text-xs text-muted mb-3">¿A dónde va mi dinero?</h3>
	{#if slices.length === 0}
		<div class="py-8 text-center text-xs text-muted">Sin gastos en este período</div>
	{:else}
		<div class="flex flex-col items-center gap-4">
			<svg viewBox="0 0 100 100" class="w-40 h-40 flex-shrink-0">
				{#each donutSlices as slice}
					<circle
						cx={CX}
						cy={CY}
						r={R}
						fill="none"
						stroke={slice.color}
						stroke-width={R - INNER_R}
						stroke-dasharray={slice.dashArray}
						stroke-dashoffset={slice.dashOffset}
						transform="rotate(-90 {CX} {CY})"
					/>
				{/each}
				<circle cx={CX} cy={CY} r={INNER_R} fill="var(--color-surface)" />
			</svg>
			<div class="w-full flex flex-col gap-1.5">
				{#each slices as slice}
					<div class="flex items-center gap-2 text-xs">
						<span class="w-3 h-3 rounded-full flex-shrink-0" style="background: {slice.color}"></span>
						<span class="text-muted flex-1 truncate">{slice.name}</span>
						<span class="text-muted">{Math.round(slice.percent)}%</span>
						<span class="text-foreground text-right w-20">${slice.amount.toLocaleString('es')}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
