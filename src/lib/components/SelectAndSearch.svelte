<script>
	import { fade, slide } from 'svelte/transition';
	import { ChevronDown, X, Lock } from 'lucide-svelte';
	let { formData, item, onchange, errors, disabled = false } = $props();

	let active = $state(false);
	let searchQuery = $state('');

	const onboardingKeys = ['onboardedEmfyn', 'onboardedFibe', 'onboardedPayU', 'onboardedRazorPay'];

	const isDisabled = $derived.by(() => {
		if (item.name !== 'parent') return false;
		return onboardingKeys.some((key) => formData[key] === true);
	});

	$effect(() => {
		if (item.name === 'parent') {
			const isAnyOnboarded = onboardingKeys.some((key) => formData[key] === true);
			const hasHospitalValue = formData[item.name] && formData[item.name] !== 'null';

			if (isAnyOnboarded) {
				if (formData[item.name]) formData[item.name] = null;
				if (errors['parent']) delete errors['parent'];
				active = false;
			}

			if (hasHospitalValue) {
				onboardingKeys.forEach((key) => {
					if (errors[key]) delete errors[key];
				});
			}
		}
	});

	let visibleOptions = $derived.by(() => {
		const cleanQuery = searchQuery.trim().toLowerCase();
		if (!cleanQuery) return item.options;
		return item.options.filter((opt) => opt.label.toLowerCase().includes(cleanQuery));
	});
</script>

<div class="relative w-full">
	<div
		onclick={() => !isDisabled && (active = !active)}
		class="flex items-center justify-between rounded-xl bg-white px-4 py-4 border transition-all duration-200
            {isDisabled ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' : ''}
            {active
			? 'border-blue-500 ring-2 ring-blue-500/10'
			: 'border-slate-200 hover:border-slate-400 cursor-pointer'}"
	>
		<div class="flex flex-col text-left overflow-hidden">
			<span
				class="truncate font-medium {formData[item.name] ? 'text-slate-700' : 'text-slate-400'}"
			>
				{#if formData[item.name]}
					{item.options.find((o) => o.value === formData[item.name])?.label || formData[item.name]}
				{:else}
					{item.placeholder}
				{/if}
			</span>
			{#if isDisabled}
				<span class="text-[10px] text-slate-400 font-medium italic">Locked by Onboarding</span>
			{/if}
		</div>

		<div class="flex items-center gap-2 ml-2 shrink-0">
			{#if formData[item.name] && !isDisabled}
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						formData[item.name] = null;
						if (onchange) onchange();
					}}
					class="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
				>
					<X size={18} />
				</button>
			{/if}

			{#if isDisabled}
				<Lock size={16} class="text-slate-400" />
			{:else}
				<div class="transition-transform duration-300 {active ? 'rotate-180' : 'rotate-0'}">
					<ChevronDown size={20} class="text-slate-500" />
				</div>
			{/if}
		</div>
	</div>

	<div class="max-height-[250px] overflow-y-auto py-1">
		{#if active && !isDisabled}
			<div
				onclick={(e) => e.stopPropagation()}
				in:slide
				out:fade
				class="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden transition-all duration-200 origin-top"
			>
				<div class="flex flex-col gap-4 px-4 py-4 mt-4 border-slate-300 rounded-2xl shadow-xl">
					<input
						bind:value={searchQuery}
						onclick={(e) => e.stopPropagation()}
						type={item.options && !isNaN(item.options[0]?.value) ? 'number' : 'text'}
						placeholder="search..."
						class="w-full bg-white border border-slate-300 p-4 rounded-2xl outline-none transition-all focus:border-blue-600 focus:bg-white text-slate-700 placeholder:text-slate-300"
					/>

					<div class="max-h-[200px] overflow-y-auto">
						{#if visibleOptions.length}
							{#each visibleOptions as option, i (i)}
								<div
									onclick={() => {
										searchQuery = '';
										formData[item.name] = option.value;
										active = false;
										if (onchange) onchange();
									}}
									class="px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors cursor-pointer flex items-center justify-between group rounded-2xl"
								>
									{option.label}
									{#if formData[item.name] === option.value}
										<div class="w-1.5 h-1.5 rounded-full bg-blue-500" />
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
