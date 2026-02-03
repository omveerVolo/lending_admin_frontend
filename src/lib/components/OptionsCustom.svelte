<script>
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	let { field, formData = $bindable({}) } = $props();
	let fold = $state();
	let active = $state(false);

	function handleSelection(item) {
		// Because it is bindable, this change will reflect in the parent instantly
		formData[field.name] = item;
		active = false;
	}
</script>

<div bind:this={fold} class="relative w-full">
	<div
		onclick={() => (active = !active)}
		class={`flex items-center justify-between rounded-xl bg-white cursor-pointer px-4 py-4 border transition-all duration-200 
                ${active ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-400'}`}
	>
		<span class={`${formData[field.name] ? 'text-slate-700' : 'text-slate-400'} font-medium`}>
			{#if formData[field.name]}
				{formData[field.name]}
			{:else}
				{field.placeholder}
			{/if}
		</span>
		<div class={`transition-transform duration-300 ${active ? 'rotate-180' : 'rotate-0'}`}>
			<ChevronDown size={20} class="text-slate-500" />
		</div>
	</div>

	<div
		class={`
                absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden transition-all duration-200 origin-top
                ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
            `}
	>
		<div class="max-height-[250px] overflow-y-auto py-1">
			{#each field.options as item, i (i)}
				<div
					onclick={() => handleSelection(item)}
					class="px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors cursor-pointer flex items-center justify-between group"
				>
					{item}
					{#if formData[field.name] === item}
						<div class="w-1.5 h-1.5 rounded-full bg-blue-500" />
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
