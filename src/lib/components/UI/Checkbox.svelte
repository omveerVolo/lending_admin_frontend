<script>
	import { Check, Lock } from 'lucide-svelte';
	import { slide, fade, fly } from 'svelte/transition';

	let {
		value = false,
		label,
		onUpdate,
		disabledIf,
		expandable = false,
		children,
		error,
		...rest
	} = $props();

	const isDisabled = $derived(typeof disabledIf === 'function' ? disabledIf() : false);

	function toggle() {
		if (!isDisabled && onUpdate) {
			onUpdate(!value);
		}
	}
</script>

<div
	class="input-container-style {isDisabled ? 'disabled-style' : ''} {value && expandable
		? 'border-[#ad5389]'
		: 'border-slate-300'}"
>
	<button
		type="button"
		disabled={isDisabled}
		onclick={toggle}
		class="w-full flex items-center justify-between group {isDisabled
			? 'cursor-not-allowed'
			: 'cursor-pointer'}"
	>
		<div class="flex flex-col text-left">
			{#if isDisabled}
				<span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Locked</span>
			{/if}
			<span class="font-semibold {value ? 'text-slate-600' : 'text-slate-400'}">
				{label}
			</span>
		</div>

		<div class="flex items-center gap-3">
			{#if isDisabled}
				<Lock size={16} class="text-slate-300/80" />
			{:else}
				<div
					class="w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center
                    {value
						? 'bg-[#ad5389] border-[#ad5389]'
						: 'border-slate-300 group-hover:border-[#ad5389]'}"
				>
					{#if value}
						<div in:fade={{ duration: 100 }}>
							<Check size={16} class="text-white" strokeWidth={3} />
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</button>

	{#if expandable && value && children}
		<div transition:slide={{ duration: 300 }}>
			<div class="h-[1px] w-full bg-slate-100 my-4"></div>

			<div class="flex flex-col gap-4 pb-2">
				{@render children()}
			</div>
		</div>
	{/if}
</div>
<div class="h-5 flex items-center">
	{#if error}
		<span transition:fly={{ y: -5, duration: 200 }} class="text-xs text-red-500 font-medium ml-2">
			{error}
		</span>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.input-container-style {
		@apply w-full bg-white border p-4 rounded-2xl transition-all duration-300;
	}

	.disabled-style {
		@apply !bg-slate-50/50 !border-slate-200;
	}
</style>
