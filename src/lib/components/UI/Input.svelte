<script>
	import { Lock } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	let { value, onUpdate, disabledIf, error, placeholder, type = 'text', ...rest } = $props();

	const isDisabled = $derived(typeof disabledIf === 'function' ? disabledIf() : false);

	function handleInput(e) {
		if (onUpdate) onUpdate(e);
	}
</script>

<div class="relative w-full flex flex-col gap-1">
	<div class="relative w-full">
		<input
			{type}
			{value}
			{placeholder}
			disabled={isDisabled}
			oninput={(e) => handleInput(e)}
			class="input-style {isDisabled ? 'disabled-style' : ''} "
		/>

		{#if isDisabled}
			<div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300/80 pointer-events-none">
				<Lock size={14} strokeWidth={2.5} />
			</div>
		{/if}
	</div>
	<!-- errros -->
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
               placeholder:text-slate-300 font-semibold;
	}

	.disabled-style {
		@apply !text-slate-300 !bg-slate-50/50 !border-slate-200 cursor-not-allowed pr-12;
	}
</style>
