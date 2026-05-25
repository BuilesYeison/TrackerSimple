<script lang="ts">
	import { goto } from "$app/navigation";
	import { toast } from "svelte-sonner";
	import { Upload } from "@lucide/svelte";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import { settingsService } from "$lib/presentation/stores/workspace";
	import { importBackupFromFile } from "$lib/utils/import-backup";
	import AccountForm from "$lib/presentation/components/AccountForm.svelte";
	import type { Currency } from "$lib/domain/entities";

	let step = $state(1);
	let currency = $state<Currency>(detectCurrency());
	let saving = $state(false);
	let importing = $state(false);
	let confirmOpen = $state(false);
	let pendingFile = $state<File | null>(null);

	function handleFileSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		pendingFile = file;
		confirmOpen = true;
		input.value = "";
	}

	async function handleImportConfirmed() {
		if (!pendingFile) return;
		importing = true;
		try {
			await importBackupFromFile(pendingFile);
			await settingsService.completeOnboarding();
			toast.success("Backup importado");
			setTimeout(() => goto("/dashboard"), 400);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al importar");
		} finally {
			importing = false;
			confirmOpen = false;
			pendingFile = null;
		}
	}

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

				<div class="flex flex-col gap-2 pt-2">
					<span class="text-xs text-muted">¿Ya tenés un backup?</span>
					<label class="flex items-center justify-center gap-2 cursor-pointer text-sm text-muted hover:text-foreground transition-colors">
						<Upload size={14} />
						{importing ? "Importando..." : "Importar backup"}
						<input type="file" accept=".json" class="hidden" onchange={handleFileSelected} disabled={importing} />
					</label>
				</div>
			</div>
		{:else if step === 2}
			<div class="flex flex-col gap-6 text-center">
				<div>
					<h1 class="text-2xl font-bold">Tus datos, tu control</h1>
					<p class="mt-3 text-sm text-muted leading-relaxed">
						Tus finanzas se guardan solo en este dispositivo. Nadie más puede verlas — ni siquiera nosotros.
					</p>
					<p class="mt-2 text-sm text-muted leading-relaxed">
						Vos decidís cuándo exportar un backup. Si cambiás de celular o desinstalás la app sin hacer backup, perdés tus datos para siempre.
					</p>
					<p class="mt-2 text-sm text-muted leading-relaxed">
						Podés exportar e importar backups desde Ajustes en cualquier momento.
					</p>
				</div>
				<button
					onclick={() => { step = 3; }}
					class="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
				>
					Entendido
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

<AlertDialog.Root bind:open={confirmOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>¿Importar backup?</AlertDialog.Title>
			<AlertDialog.Description>
				Esto reemplazará todos tus datos actuales. Esta acción no se puede deshacer.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleImportConfirmed}>
				{importing ? "Importando..." : "Importar"}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
