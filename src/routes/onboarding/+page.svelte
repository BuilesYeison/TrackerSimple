<script lang="ts">
	import { goto } from "$app/navigation";
	import { toast } from "svelte-sonner";
	import { Folder } from "@lucide/svelte";
	import { settingsService } from "$lib/presentation/stores/workspace";
	import AccountForm from "$lib/presentation/components/AccountForm.svelte";
	import type { Currency } from "$lib/domain/entities";

	let step = $state(1);
	let currency = $state<Currency>(detectCurrency());
	let saving = $state(false);

	function detectCurrency(): Currency {
		const lang = navigator.language.toLowerCase();
		if (lang === "es-ar") return "ARS";
		if (lang === "es-mx") return "MXN";
		if (lang === "es-cl") return "CLP";
		if (lang === "es-pe") return "PEN";
		if (lang.startsWith("es")) return "COP";
		if (lang.startsWith("en")) return "USD";
		if (lang.startsWith("fr")) return "EUR";
		return "COP";
	}

	async function saveCurrency() {
		saving = true;
		try {
			await settingsService.setCurrency(currency);
			step = 4;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al guardar");
		} finally {
			saving = false;
		}
	}

	function onAccountCreated() {
		step = 5;
	}

	async function finishOnboarding() {
		saving = true;
		try {
			await settingsService.completeOnboarding();
			goto("/dashboard");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al finalizar");
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex h-full items-center justify-center p-6">
	<div class="w-full max-w-md">
		{#if step === 1}
			<div class="flex flex-col gap-6 text-center">
				<div>
					<h1 class="text-2xl font-bold">Tus finanzas, simples y privadas</h1>
					<p class="mt-3 text-sm text-muted leading-relaxed">
						Registrá gastos, ingresos y transferencias en segundos. Todo queda en tu dispositivo — sin cuentas, sin servidores, sin complicaciones.
					</p>
				</div>
				<button
					onclick={() => { step = 2; }}
					class="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
				>
					Comenzar
				</button>
			</div>
		{:else if step === 2}
			<div class="flex flex-col gap-6 text-center">
				<div>
					<h1 class="text-2xl font-bold">Tus datos, tu control</h1>
					<p class="mt-3 text-sm text-muted leading-relaxed">
						Tus datos se guardan solo en este dispositivo. Si desinstalás la app sin hacer backup, los perdés.
					</p>
				</div>
				<div class="flex flex-col items-center gap-2 rounded-xl bg-surface p-4">
					<Folder class="size-8 text-muted" />
					<span class="text-sm text-muted">Almacenamiento interno de la app</span>
				</div>
				<button
					onclick={() => { step = 3; }}
					class="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
				>
					Usar ubicación por defecto
				</button>
			</div>
		{:else if step === 3}
			<div class="flex flex-col gap-6 text-center">
				<div>
					<h1 class="text-2xl font-bold">¿Qué moneda usás?</h1>
					<p class="mt-2 text-sm text-muted">Seleccioná la moneda principal para tus cuentas</p>
				</div>
				<select
					bind:value={currency}
					class="rounded-lg border border-border bg-background px-3 py-3 w-full text-center text-lg text-foreground"
				>
					<option value="COP">COP — Peso colombiano</option>
					<option value="USD">USD — Dólar estadounidense</option>
					<option value="EUR">EUR — Euro</option>
					<option value="ARS">ARS — Peso argentino</option>
					<option value="MXN">MXN — Peso mexicano</option>
					<option value="CLP">CLP — Peso chileno</option>
					<option value="PEN">PEN — Sol peruano</option>
				</select>
				<button
					onclick={saveCurrency}
					disabled={saving}
					class="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
				>
					{saving ? "Guardando..." : "Siguiente"}
				</button>
			</div>
		{:else if step === 4}
			<div class="flex flex-col gap-4">
				<div class="text-center">
					<h1 class="text-2xl font-bold">Creá tu primera cuenta</h1>
					<p class="mt-2 text-sm text-muted">Necesitás al menos una cuenta para empezar</p>
				</div>
				<AccountForm mode="create" onsuccess={onAccountCreated} />
			</div>
		{:else}
			<div class="flex flex-col items-center gap-6 text-center">
				<div>
					<h1 class="text-2xl font-bold">¡Listo!</h1>
					<p class="mt-2 text-sm text-muted">Todo configurado</p>
				</div>
				<button
					onclick={finishOnboarding}
					disabled={saving}
					class="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
				>
					{saving ? "Entrando..." : "Entrar"}
				</button>
			</div>
		{/if}
	</div>
</div>
