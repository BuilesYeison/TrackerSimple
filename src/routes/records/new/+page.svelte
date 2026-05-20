<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { ArrowLeft, Calendar, Delete } from "@lucide/svelte";
	import {
		DatePicker,
		Portal,
		parseDate,
	} from "@skeletonlabs/skeleton-svelte";
	import {
		accountService,
		categoryService,
		recordService,
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

	let today = new Date();
	let dateValue = $state([parseDate(today.toISOString().split("T")[0])]);

	let calcDisplay = $state("0");
	let calcPrevious: number | null = $state(null);
	let calcOp: string | null = $state(null);
	let calcReset = $state(false);

	onMount(async () => {
		accounts = await accountService.getActive();
		categories = await categoryService.getAll();
		if (accounts.length > 0) accountId = accounts[0].id;
	});

	async function save() {
		if (!accountId) return;
		if (recordType !== "transfer" && !categoryId) return;
		if (recordType === "transfer" && !toAccountId) return;

		saving = true;

		const selectedDate = dateValue[0];
		const year = selectedDate.year;
		const month = String(selectedDate.month).padStart(2, "0");
		const day = String(selectedDate.day).padStart(2, "0");
		const createdAt = new Date(`${year}-${month}-${day}`);

		let amount = parseFloat(calcDisplay);
		if (isNaN(amount)) amount = 0;

		try {
			await recordService.register({
				type: recordType,
				amount,
				accountId,
				toAccountId: recordType === "transfer" ? toAccountId : null,
				categoryId: recordType === "transfer" ? "" : categoryId,
				note: note || null,
			});
			goto("/records");
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

	function clearCalc() {
		calcDisplay = "0";
		calcPrevious = null;
		calcOp = null;
		calcReset = false;
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
</script>

<div class="mx-auto flex max-w-md flex-col gap-3 p-0">
	<header class="flex items-center gap-3 relative">
		<button
			onclick={goBack}
			class="btn btn-icon btn-ghost-surface btn-sm absolute top-0 left-0"
			style="top: -0.2rem; left: -0.5rem; "
			aria-label="Atrás"
		>
			<ArrowLeft size={22} />
		</button>
		<span class="text-center m-auto">Nuevo registro</span>
	</header>

	<div class="grid grid-cols-3 gap-2 rounded-2xl bg-surface-100-900 p-1">
		<button
			class="rounded-xl py-2 text-sm font-medium transition-colors {recordType ===
			'expense'
				? 'bg-error-500 text-white'
				: 'text-surface-700-300'}"
			onclick={() => {
				recordType = "expense";
				categoryId = "";
			}}>Gasto</button
		>
		<button
			class="rounded-xl py-2 text-sm font-medium transition-colors {recordType ===
			'income'
				? 'bg-primary-500 text-white'
				: 'text-surface-700-300'}"
			onclick={() => {
				recordType = "income";
				categoryId = "";
			}}>Ingreso</button
		>
		<button
			class="rounded-xl py-2 text-sm font-medium transition-colors {recordType ===
			'transfer'
				? 'bg-secondary-500 text-white'
				: 'text-surface-700-300'}"
			onclick={() => {
				recordType = "transfer";
				categoryId = "";
			}}>Transferencia</button
		>
	</div>

	<div
		class="text-center bg-surface-400 p-5 flex items-center justify-center rounded-lg"
	>
		<span class="text-5xl p-0 m-0">
			<span class="text-white p-0 m-0">${calcDisplay}</span>
		</span>
	</div>

	<DatePicker
		value={dateValue}
		class="p-0"
		onValueChange={(e) => {
			dateValue = e.value;
		}}
		locale="es"
	>
		<DatePicker.Label class="block text-xs font-medium text-surface-600-400"
			>Fecha</DatePicker.Label
		>
		<DatePicker.Control>
			<DatePicker.Input class="input w-full" />
			<DatePicker.Trigger
				class="btn btn-icon btn-ghost-surface btn-sm absolute right-2 top-1/2 -translate-y-1/2"
			>
				<Calendar size={16} />
			</DatePicker.Trigger>
		</DatePicker.Control>
		<Portal>
			<DatePicker.Positioner>
				<DatePicker.Content>
					<DatePicker.View view="day">
						<DatePicker.Context>
							{#snippet children(datePicker)}
								<DatePicker.ViewControl>
									<DatePicker.PrevTrigger />
									<DatePicker.ViewTrigger>
										<DatePicker.RangeText />
									</DatePicker.ViewTrigger>
									<DatePicker.NextTrigger />
								</DatePicker.ViewControl>
								<DatePicker.Table>
									<DatePicker.TableHead>
										<DatePicker.TableRow>
											{#each datePicker().weekDays as weekDay, id (id)}
												<DatePicker.TableHeader
													>{weekDay.short}</DatePicker.TableHeader
												>
											{/each}
										</DatePicker.TableRow>
									</DatePicker.TableHead>
									<DatePicker.TableBody>
										{#each datePicker().weeks as week, id (id)}
											<DatePicker.TableRow>
												{#each week as day, id (id)}
													<DatePicker.TableCell
														value={day}
													>
														<DatePicker.TableCellTrigger
															>{day.day}</DatePicker.TableCellTrigger
														>
													</DatePicker.TableCell>
												{/each}
											</DatePicker.TableRow>
										{/each}
									</DatePicker.TableBody>
								</DatePicker.Table>
							{/snippet}
						</DatePicker.Context>
					</DatePicker.View>
					<DatePicker.View view="month">
						<DatePicker.Context>
							{#snippet children(datePicker)}
								<DatePicker.ViewControl>
									<DatePicker.PrevTrigger />
									<DatePicker.ViewTrigger>
										<DatePicker.RangeText />
									</DatePicker.ViewTrigger>
									<DatePicker.NextTrigger />
								</DatePicker.ViewControl>
								<DatePicker.Table>
									<DatePicker.TableBody>
										{#each datePicker().getMonthsGrid( { columns: 4, format: "short" }, ) as months, id (id)}
											<DatePicker.TableRow>
												{#each months as month, id (id)}
													<DatePicker.TableCell
														value={month.value}
													>
														<DatePicker.TableCellTrigger
															>{month.label}</DatePicker.TableCellTrigger
														>
													</DatePicker.TableCell>
												{/each}
											</DatePicker.TableRow>
										{/each}
									</DatePicker.TableBody>
								</DatePicker.Table>
							{/snippet}
						</DatePicker.Context>
					</DatePicker.View>
					<DatePicker.View view="year">
						<DatePicker.Context>
							{#snippet children(datePicker)}
								<DatePicker.ViewControl>
									<DatePicker.PrevTrigger />
									<DatePicker.ViewTrigger>
										<DatePicker.RangeText />
									</DatePicker.ViewTrigger>
									<DatePicker.NextTrigger />
								</DatePicker.ViewControl>
								<DatePicker.Table>
									<DatePicker.TableBody>
										{#each datePicker().getYearsGrid( { columns: 4 }, ) as years, id (id)}
											<DatePicker.TableRow>
												{#each years as year, id (id)}
													<DatePicker.TableCell
														value={year.value}
													>
														<DatePicker.TableCellTrigger
															>{year.label}</DatePicker.TableCellTrigger
														>
													</DatePicker.TableCell>
												{/each}
											</DatePicker.TableRow>
										{/each}
									</DatePicker.TableBody>
								</DatePicker.Table>
							{/snippet}
						</DatePicker.Context>
					</DatePicker.View>
				</DatePicker.Content>
			</DatePicker.Positioner>
		</Portal>
	</DatePicker>

	<label class="flex flex-col gap-1 text-xs font-medium text-surface-600-400">
		<span>Cuenta origen</span>
		<select bind:value={accountId} class="input w-full p-2">
			<option value="" disabled>Selecciona cuenta</option>
			{#each accounts as a (a.id)}
				<option value={a.id}>{a.name} ({a.currency})</option>
			{/each}
		</select>
	</label>

	{#if recordType === "transfer"}
		<label
			class="flex flex-col gap-1 text-xs font-medium text-surface-600-400"
		>
			<span>Cuenta destino</span>
			<select bind:value={toAccountId} class="input w-full p-2">
				<option value="" disabled>Selecciona cuenta</option>
				{#each availableAccounts as a (a.id)}
					<option value={a.id}>{a.name} ({a.currency})</option>
				{/each}
			</select>
		</label>
	{:else}
		<label
			class="flex flex-col gap-1 text-xs font-medium text-surface-600-400"
		>
			<span>Categoría</span>
			<select bind:value={categoryId} class="input w-full p-2">
				<option value="" disabled>Selecciona categoría</option>
				{#each filteredCategories as c (c.id)}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
		</label>
	{/if}

	<label class="flex flex-col gap-1 text-xs font-medium text-surface-600-400">
		<span>Nota (opcional)</span>
		<input
			bind:value={note}
			type="text"
			class="input w-full"
			placeholder="Agrega una nota..."
		/>
	</label>

	<div class="grid grid-cols-4 gap-2">
		<div class="col-span-3 grid grid-cols-3 gap-2">
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("7")}>7</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("8")}>8</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("9")}>9</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("4")}>4</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("5")}>5</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("6")}>6</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("1")}>1</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("2")}>2</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("3")}>3</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit(".")}>.</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={() => pressDigit("0")}>0</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl border text-lg"
				onclick={pressBackspace}><Delete class="size-5" /></button
			>
		</div>
		<div class="col-span-1 grid grid-rows-5 gap-2">
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl text-lg"
				onclick={() => pressOp("÷")}>÷</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl text-lg"
				onclick={() => pressOp("×")}>×</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl text-lg"
				onclick={() => pressOp("-")}>−</button
			>
			<button
				class="btn btn-ghost-surface btn-lg rounded-xl text-lg"
				onclick={() => pressOp("+")}>+</button
			>
			<button
				class="btn btn-filled-primary btn-lg rounded-xl text-lg row-span-1"
				onclick={() => pressOp("=")}>=</button
			>
		</div>
	</div>

	<button
		class="btn btn-filled-primary w-full p-2 {recordType === 'transfer'
			? 'bg-secondary-500'
			: recordType == 'expense'
				? 'bg-error-500'
				: 'bg-primary-500'}"
		onclick={save}
		disabled={saving}
	>
		{saving ? "Guardando..." : "Guardar"}
	</button>
</div>
