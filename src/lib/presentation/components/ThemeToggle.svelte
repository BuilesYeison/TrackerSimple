<script lang="ts">
	import { onMount } from 'svelte';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Sun, Moon } from '@lucide/svelte';

	let darkMode = $state(false);

	function onCheckedChange(e: { checked: boolean }) {
		darkMode = e.checked;
		const mode = darkMode ? 'dark' : 'light';
		document.documentElement.setAttribute('data-mode', mode);
		localStorage.setItem('mode', mode);
	}

	onMount(() => {
		const mode = localStorage.getItem('mode') || 'light';
		darkMode = mode === 'dark';
	});
</script>

<svelte:head>
	<script>
		(function() {
			var mode = localStorage.getItem('mode') || 'light';
			document.documentElement.setAttribute('data-mode', mode);
		})();
	</script>
</svelte:head>

<div class="flex items-center gap-2">
	<Sun size={16} />
	<Switch checked={darkMode} onCheckedChange={onCheckedChange}>
		<Switch.Control>
			<Switch.Thumb />
		</Switch.Control>
		<Switch.HiddenInput />
	</Switch>
	<Moon size={16} />
</div>
