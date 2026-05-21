<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { ArrowLeft, Delete, ChevronDown } from "@lucide/svelte";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Calendar as CalendarComp } from "$lib/components/ui/calendar/index.js";
	import { toast } from "svelte-sonner";
	import {
		CalendarDate,
		today,
		getLocalTimeZone,
	} from "@internationalized/date";
	import {
		accountService,
		categoryService,
		recordService,
		workspaceReady,
	} from "$lib/presentation/stores/workspace";
	import type { Account } from "$lib/domain/entities";
	import type { Category } from "$lib/domain/entities";

	let recordType = $state<"expense" | "income" | "transfer">("expense");
	let accounts: Account[] = $state([]);
	let categories: Category[] = $state([]);
	let accountId = $state("");
	let toAccountId = $state("");
	let categoryId = $state("");
	let note = $state("");
	let saving = $state(false);

	let value = $state<CalendarDate>(today(getLocalTimeZone()));

	let calcDisplay = $state("0");
	let calcPrevious: number | null = $state(null);
	let calcOp: string | null = $state(null);
	let calcReset = $state(false);

	onMount(async () => {
		await workspaceReady;
		accounts = await accountService.getActive();
		categories = await categoryService.getAll();
		if (accounts.length > 0) accountId = accounts[0].id;
	});

	async function save() {
		if (!accountId) {
			toast.warning("Selecciona una cuenta origen");
			return;
		}
		if (recordType !== "transfer" && !categoryId) {
			toast.warning("Selecciona una categoría");
			return;
		}
		if (recordType === "transfer" && !toAccountId) {
			toast.warning("Selecciona una cuenta destino");
			return;
		}

		saving = true;

		let amount = parseFloat(calcDisplay);
		if (isNaN(amount)) amount = 0;

		try {
			const date = value.toDate(getLocalTimeZone());
			await recordService.register({
				type: recordType,
				amount,
				accountId,
				toAccountId: recordType === "transfer" ? toAccountId : null,
				categoryId: recordType === "transfer" ? "" : categoryId,
				note: note || null,
				date,
			});
			toast.success("Registro guardado");
			setTimeout(() => goto("/records"), 600);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Algo salió mal");
		} finally {
			saving = false;
		}
	}

	function goBack() {
		history.back();
	}

	function pressDigit(d: string) {
		if (calcReset) {
			calcDisplay = d;
			calcReset = false;
		} else {
			if (calcDisplay === "0" && d !== ".") {
				calcDisplay = d;
			} else {
				if (d === "." && calcDisplay.includes(".")) return;
				if (calcDisplay.length >= 12) return;
				calcDisplay += d;
			}
		}
	}

	function pressOp(op: string) {
		const current = parseFloat(calcDisplay);
		if (calcOp && !calcReset) {
			calcDisplay = calculate(calcPrevious!, current, calcOp);
			calcPrevious = null;
		}
		if (op === "=") {
			if (calcOp && calcPrevious !== null) {
				calcDisplay = calculate(calcPrevious, current, calcOp);
			}
			calcOp = null;
			calcPrevious = null;
			calcReset = true;
		} else {
			calcPrevious = parseFloat(calcDisplay);
			calcOp = op;
			calcReset = true;
		}
	}

	function calculate(a: number, b: number, op: string): string {
		let result = 0;
		switch (op) {
			case "+":
				result = a + b;
				break;
			case "-":
				result = a - b;
				break;
			case "×":
				result = a * b;
				break;
			case "÷":
				result = b !== 0 ? a / b : 0;
				break;
		}
		const str = result.toFixed(2);
		if (str.endsWith(".00")) return result.toString();
		return str;
	}

	function pressBackspace() {
		if (calcReset) return;
		if (calcDisplay.length <= 1) {
			calcDisplay = "0";
		} else {
			calcDisplay = calcDisplay.slice(0, -1);
		}
	}

	const filteredCategories = $derived(
		categories.filter(
			(c) => c.type === (recordType === "income" ? "income" : "expense"),
		),
	);
	const availableAccounts = $derived(
		recordType === "transfer"
			? accounts.filter((a) => a.id !== accountId)
			: [],
	);

	const dateLabel = $derived(
		value
			.toDate(getLocalTimeZone())
			.toLocaleDateString("es", { dateStyle: "long" }),
	);
</script>

<div class="mx-auto flex h-full max-w-md flex-col">
	<header class="flex items-center gap-3 relative">
		<button
			onclick={goBack}
			class="rounded-lg text-[#fafafa] hover:bg-[#141414] transition-colors absolute"
			aria-label="Atrás"
		>
			<ArrowLeft size={22} />
		</button>
		<span class="text-center m-auto">Nuevo registro</span>
	</header>
	<div class="h-1/2 overflow-y-auto px-2 flex flex-col gap-3">
		<div class="grid grid-cols-3 gap-2 rounded-xl bg-[#111] p-1">
			<button
				class="rounded-xl py-2 text-sm font-medium transition-colors {recordType ===
				'expense'
					? 'bg-[#f87171] text-white'
					: 'text-[#444]'}"
				onclick={() => {
					recordType = "expense";
					categoryId = "";
				}}>Gasto</button
			>
			<button
				class="rounded-xl py-2 text-sm font-medium transition-colors {recordType ===
				'income'
					? 'bg-[#4ade80] text-[#0a0a0a]'
					: 'text-[#444]'}"
				onclick={() => {
					recordType = "income";
					categoryId = "";
				}}>Ingreso</button
			>
			<button
				class="rounded-xl py-2 text-sm font-medium transition-colors {recordType ===
				'transfer'
					? 'bg-[#a78bfa] text-white'
					: 'text-[#444]'}"
				onclick={() => {
					recordType = "transfer";
					categoryId = "";
				}}>Transferencia</button
			>
		</div>

		<div
			class="text-center bg-[#141414] p-5 flex items-center justify-center rounded-lg"
		>
			<span class="text-5xl p-0 m-0">
				<span class="text-[#fafafa] font-light p-0 m-0"
					>${calcDisplay}</span
				>
			</span>
		</div>

		<div class="flex flex-col gap-1">
			<span class="text-xs font-medium text-[#444]">Fecha</span>
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="flex w-full items-center justify-between rounded-lg border border-[#141414] bg-[#0a0a0a] px-3 py-2 text-sm text-[#fafafa] font-normal hover:bg-[#111] transition-colors"
						>
							{dateLabel}
							<ChevronDown size={16} />
						</button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0">
					<CalendarComp
						type="single"
						bind:value
						captionLayout="dropdown"
					/>
				</Popover.Content>
			</Popover.Root>
		</div>

		<label class="flex flex-col gap-1 text-xs font-medium text-[#444]">
			<span>Cuenta origen</span>
			<select
				bind:value={accountId}
				class="rounded-lg border border-[#141414] bg-[#0a0a0a] px-3 py-2 w-full text-sm text-[#fafafa]"
			>
				<option value="" disabled>Selecciona cuenta</option>
				{#each accounts as a (a.id)}
					<option value={a.id}>{a.name} ({a.currency})</option>
				{/each}
			</select>
		</label>

		{#if recordType === "transfer"}
			<label class="flex flex-col gap-1 text-xs font-medium text-[#444]">
				<span>Cuenta destino</span>
				<select
					bind:value={toAccountId}
					class="rounded-lg border border-[#141414] bg-[#0a0a0a] px-3 py-2 w-full text-sm text-[#fafafa]"
				>
					<option value="" disabled>Selecciona cuenta</option>
					{#each availableAccounts as a (a.id)}
						<option value={a.id}>{a.name} ({a.currency})</option>
					{/each}
				</select>
			</label>
		{:else}
			<label class="flex flex-col gap-1 text-xs font-medium text-[#444]">
				<span>Categoría</span>
				<select
					bind:value={categoryId}
					class="rounded-lg border border-[#141414] bg-[#0a0a0a] px-3 py-2 w-full text-sm text-[#fafafa]"
				>
					<option value="" disabled>Selecciona categoría</option>
					{#each filteredCategories as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</select>
			</label>
		{/if}

		<label class="flex flex-col gap-1 text-xs font-medium text-[#444]">
			<span>Nota (opcional)</span>
			<input
				bind:value={note}
				type="text"
				class="rounded-lg border border-[#141414] bg-[#0a0a0a] px-3 py-2 w-full text-sm text-[#fafafa] placeholder:text-[#2a2a2a]"
				placeholder="Agrega una nota..."
			/>
		</label>
	</div>

	<div class="h-1/2 shrink-0 flex flex-col gap-3">
		<div class="flex-1 flex items-center">
			<div class="grid grid-cols-4 gap-2 w-full">
				<div class="col-span-3 grid grid-cols-3 gap-2">
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("7")}>7</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("8")}>8</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("9")}>9</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("4")}>4</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("5")}>5</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("6")}>6</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("1")}>1</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("2")}>2</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("3")}>3</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit(".")}>.</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressDigit("0")}>0</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={pressBackspace}
						><Delete class="size-5 m-auto" /></button
					>
				</div>
				<div class="col-span-1 grid grid-rows-5 gap-2">
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressOp("÷")}>÷</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressOp("×")}>×</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressOp("-")}>−</button
					>
					<button
						class="rounded-xl border border-[#141414] py-3 text-lg text-[#fafafa] hover:bg-[#141414] transition-colors"
						onclick={() => pressOp("+")}>+</button
					>
					<button
						class="rounded-xl bg-[#fafafa] py-3 text-lg font-medium text-[#0a0a0a] hover:bg-[#e5e5e5] transition-colors"
						onclick={() => pressOp("=")}>=</button
					>
				</div>
			</div>
		</div>

		<button
			class="w-full rounded-xl bg-[#fafafa] px-4 py-3 text-sm font-medium text-[#0a0a0a] disabled:opacity-50"
			onclick={save}
			disabled={saving}
		>
			{saving ? "Guardando..." : "Guardar"}
		</button>
	</div>
</div>
