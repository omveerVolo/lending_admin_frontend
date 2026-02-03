<script>
	let { step = $bindable(), stepCompletion, steps } = $props();
	import { Check } from 'lucide-svelte';

	let classInactive =
		'w-8 h-8 rounded-full bg-white transition-all flex items-center justify-center duration-300 z-10 cursor-pointer';
	let classActive =
		'w-8 h-8 bg-black text-white rounded-full transition-all flex items-center justify-center duration-300 z-10  cursor-pointer';
</script>

<div class="flex items-center justify-between mx-auto w-72 py-6 px-5 relative mb-2">
	{#each steps as item, idx (idx)}
		{@const currentIdx = idx + 1}
		<div class="flex items-center flex-1 last:flex-none">
			<div class={`flex flex-col gap-2 items-center justify-center relative`}>
				<div
					onclick={() => {
						// Allowed to click if step is completed or it's the very first step
						if (stepCompletion[currentIdx] || currentIdx === 1 || stepCompletion[currentIdx - 1]) {
							step = currentIdx;
						}
					}}
					class="w-8 h-8 rounded-full transition-all flex items-center justify-center duration-300 z-10 cursor-pointer border-2"
					class:ring-2={step == currentIdx}
					class:ring-offset-2={step == currentIdx}
					class:border-gray-400={!stepCompletion[currentIdx]}
				>
					{#if stepCompletion[currentIdx]}
						<Check size={18} strokeWidth={3} />
					{:else}
						<div class="rounded-full transition-all duration-500 ease-out"></div>
					{/if}
				</div>
				<h1 class="text-[10px] font-medium absolute -bottom-6 whitespace-nowrap">
					{item}
				</h1>
			</div>

			{#if idx < steps.length - 1}
				<div class="flex-1 h-[2px] mx-2 bg-slate-200 relative">
					<div
						class="absolute inset-0 bg-black transition-all duration-500"
						style="width: {stepCompletion[currentIdx] ? '100%' : '0%'}"
					></div>
				</div>
			{/if}
		</div>
	{/each}
</div>
