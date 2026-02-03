<script>
	import { fade, slide } from 'svelte/transition';
	import { ChevronDown, X, Lock } from 'lucide-svelte';

	let {
		formData = $bindable(),
		item,
		onchange,
		errors = $bindable(),
		isDisabled = false
	} = $props();

	let active = $state(false);

	let options = $derived(item?.options || []);

	const onboardingKeys = ['onboardedEmfyn', 'onboardedFibe', 'onboardedPayU', 'onboardedRazorPay'];

	const fieldKey = item.name || item.label;

	const component_disable = $derived.by(() => {
		if (fieldKey !== 'parent') return false;
		return onboardingKeys.some((key) => formData[key] === true);
	});

	$effect(() => {
		if (fieldKey === 'parent') {
			const isAnyOnboarded = onboardingKeys.some((key) => formData[key] === true);
			if (isAnyOnboarded) {
				if (formData[fieldKey]) formData[fieldKey] = null;
				if (errors[fieldKey]) delete errors[fieldKey];
				active = false;
			}
		}
	});

	// FIX 3: Find the label inside the {label, value} structure
	const selectedLabel = $derived.by(() => {
		const currentVal = formData[fieldKey];
		if (!currentVal) return null;
		const found = options.find((opt) => opt.value === currentVal);
		return found ? found.label : currentVal;
	});
</script>

<div class={`relative w-full ${component_disable || isDisabled ? 'cursor-not-allowed' : ''}`}>
	<div class="w-full">
		<div
			onclick={() => !component_disable && (active = !active)}
			class="flex items-center justify-between rounded-xl px-4 py-4 border transition-all duration-200
                {isDisabled
				? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
				: 'bg-white'}
                {active
				? 'border-blue-500 ring-2 ring-blue-500/10'
				: 'border-slate-200 hover:border-slate-400'} cursor-pointer"
		>
			<div class="flex flex-col text-left">
				{#if isDisabled}
					<span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Locked</span>
				{/if}
				<span class="font-medium {formData[fieldKey] ? 'text-slate-700' : 'text-slate-300'}">
					{formData[fieldKey] ? selectedLabel : item.placeholder}
				</span>
			</div>

			<div class="flex items-center gap-2">
				{#if formData[fieldKey] && !isDisabled}
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							formData[fieldKey] = null;
							if (onchange) onchange();
						}}
						class="p-1 text-slate-400 hover:text-red-500 transition-colors"
					>
						<X size={18} />
					</button>
				{/if}

				{#if component_disable}
					<Lock size={16} class="text-slate-400" />
				{:else}
					<div class="transition-transform duration-300 {active ? 'rotate-180' : 'rotate-0'}">
						<ChevronDown size={20} class="text-slate-500" />
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if active && !component_disable}
		<div
			in:slide={{ duration: 200 }}
			out:fade={{ duration: 150 }}
			class="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden origin-top"
		>
			<div class="max-h-[250px] overflow-y-auto p-2">
				{#if options.length}
					{#each options as option}
						<div
							onclick={() => {
								formData[fieldKey] = option.value;
								if (onchange) onchange();
								active = false;
							}}
							class="px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors cursor-pointer flex items-center justify-between group rounded-lg"
						>
							{option.label}
							{#if formData[fieldKey] === option.value}
								<div class="w-2 h-2 rounded-full bg-blue-500" />
							{/if}
						</div>
					{/each}
				{:else}
					<div class="px-4 py-3 text-slate-400 text-sm">No options available</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
