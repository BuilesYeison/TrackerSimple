<script lang="ts">
	let {
		value,
		onchange,
	}: {
		value: '3m' | '6m' | 'year';
		onchange: (p: '3m' | '6m' | 'year') => void;
	} = $props();
</script>

<div class="grid grid-cols-3 gap-2 rounded-xl bg-surface p-1">
	<button
		class="rounded-xl py-2 text-sm font-medium transition-colors {value === '3m' ? 'bg-primary text-primary-foreground' : 'text-muted'}"
		onclick={() => onchange('3m')}
	>3 meses</button>
	<button
		class="rounded-xl py-2 text-sm font-medium transition-colors {value === '6m' ? 'bg-primary text-primary-foreground' : 'text-muted'}"
		onclick={() => onchange('6m')}
	>6 meses</button>
	<button
		class="rounded-xl py-2 text-sm font-medium transition-colors {value === 'year' ? 'bg-primary text-primary-foreground' : 'text-muted'}"
		onclick={() => onchange('year')}
	>Este año</button>
</div>
