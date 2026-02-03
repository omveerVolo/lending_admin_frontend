<script>
	import { ChevronDown, X, Lock } from 'lucide-svelte';
	import { fade, fly, slide } from 'svelte/transition';

	let {
		value,
		options = [],
		onUpdate,
		disabledIf,
		error,
		placeholder = 'Select option',
		...rest
	} = $props();

	let active = $state(false);

	const isDisabled = $derived(typeof disabledIf === 'function' ? disabledIf() : false);

	// Find the label for display based on current value
	const selectedLabel = $derived(options.find((opt) => opt.value === value)?.label || '');

	function handleClear(e) {
		e.stopPropagation(); // Prevents the dropdown from toggling
		active = false;
		if (onUpdate) onUpdate(null);
	}
</script>

<div class="relative w-full flex flex-col gap-1">
	<div class="relative w-full">
		<button
			type="button"
			disabled={isDisabled}
			onclick={() => (active = !active)}
			class="input-style flex items-center justify-between {isDisabled
				? 'disabled-style'
				: ''} {error ? 'border-red-400 focus:border-red-400' : ''}"
		>
			<div class="flex flex-col text-left">
				{#if isDisabled}
					<span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Locked</span>
				{/if}
				<span class="font-semibold {value ? 'text-slate-500' : 'text-slate-300'}">
					{selectedLabel || placeholder}
				</span>
			</div>

			<div class="flex items-center gap-2">
				{#if value && !isDisabled}
					<div
						role="button"
						tabindex="0"
						onclick={handleClear}
						onkeydown={(e) => e.key === 'Enter' && handleClear(e)}
						class="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
					>
						<X size={18} />
					</div>
				{/if}

				{#if isDisabled}
					<Lock size={16} class="text-slate-300/80" />
				{:else}
					<div class="transition-transform duration-300 {active ? 'rotate-180' : 'rotate-0'}">
						<ChevronDown size={20} class="text-slate-500" />
					</div>
				{/if}
			</div>
		</button>

		{#if active && !isDisabled}
			<div
				in:slide={{ duration: 200 }}
				out:fade={{ duration: 150 }}
				class="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden origin-top"
			>
				<div class="max-h-[250px] overflow-y-auto p-2">
					{#if options.length}
						{#each options as option}
							<button
								type="button"
								onclick={() => {
									if (onUpdate) onUpdate(option.value);
									active = false;
								}}
								class="w-full px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-[#ad5389] font-semibold transition-colors cursor-pointer flex items-center justify-between rounded-lg"
							>
								{option.label}
								{#if value === option.value}
									<div class="w-2 h-2 rounded-full bg-[#ad5389]" />
								{/if}
							</button>
						{/each}
					{:else}
						<div class="px-4 py-3 text-slate-400 text-sm">No options available</div>
					{/if}
				</div>
			</div>

			<button
				type="button"
				class="fixed inset-0 z-[-1] cursor-default cursor-pointer"
				onclick={() => (active = false)}
			></button>
		{/if}
	</div>

	<div class="h-5 flex items-center">
		{#if error}
			<span transition:fly={{ y: -5, duration: 200 }} class="text-xs text-red-500 font-medium ml-2">
				{error}
			</span>
		{/if}
	</div>
</div>

<style>
	@reference "tailwindcss";

	.input-style {
		@apply w-full bg-white border border-slate-300 p-4 rounded-2xl outline-none 
               transition-all focus:border-[#ad5389] focus:bg-white text-slate-500 
               placeholder:text-slate-300 font-medium;
	}

	.disabled-style {
		@apply !text-slate-300 !bg-slate-50/50 !border-slate-200 cursor-not-allowed;
	}
</style>
