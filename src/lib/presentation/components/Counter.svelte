<script lang="ts">
	let count = $state(0);

	function increment() {
		count++;
	}

	function reset() {
		count = 0;
	}
</script>

<div class="flex flex-col items-center gap-4 p-8">
	<p class="text-6xl font-bold">{count}</p>
	<div class="flex gap-4">
		<button class="btn btn-filled-primary" onclick={increment}>+1</button>
		<button class="btn btn-filled-surface" onclick={reset}>Reset</button>
	</div>
</div>
