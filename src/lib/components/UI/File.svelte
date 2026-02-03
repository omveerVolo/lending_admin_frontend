<script>
	import { Lock, Trash2, ExternalLink } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	let { value, label, name, onUpdate, disabledIf, error } = $props();

	let fileInput;

	const isDisabled = $derived(typeof disabledIf === 'function' ? disabledIf() : false);

	function handleFileChange(e) {
		const file = e.target.files?.[0] ?? null;
		if (!file) return;

		// 1. Size Check
		if (file.size > 5 * 1024 * 1024) {
			alert('File too large (Max 5MB)');
			e.target.value = '';
			return;
		}

		// 2. Type Check
		const isDocx = file.name.toLowerCase().endsWith('.docx');
		const isPdf = file.type === 'application/pdf';

		if (name === 'msaAgreement') {
			if (!isPdf && !isDocx) {
				alert('Only Docx or PDF allowed');
				e.target.value = '';
				return;
			}
		} else if (!isPdf) {
			alert('Only PDF allowed');
			e.target.value = '';
			return;
		}

		if (onUpdate) onUpdate(file);
	}

	function removeFile() {
		if (onUpdate) onUpdate(null);
		if (fileInput) fileInput.value = '';
	}
</script>

<div class="flex flex-col gap-1 w-full relative">
	<input
		bind:this={fileInput}
		type="file"
		id={name}
		class="hidden"
		disabled={isDisabled}
		onchange={handleFileChange}
		accept={name === 'msaAgreement' ? '.pdf,.docx' : '.pdf'}
	/>

	<div class="relative w-full">
		{#if !value}
			<label
				for={name}
				class="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 transition-all
                {isDisabled
					? 'opacity-50 cursor-not-allowed'
					: 'cursor-pointer hover:border-[#ad5389] hover:bg-[#ad5389]/5'}"
			>
				<span class="text-[#ad5389] font-semibold text-lg">{isDisabled ? '' : '＋'}</span>
				<span class="text-slate-500 text-sm font-medium">
					{isDisabled ? 'Field Locked' : `Upload ${label}`}
				</span>
			</label>
		{:else}
			<div
				class="flex items-center justify-between gap-3 w-full p-4 rounded-2xl border border-slate-300 bg-white {isDisabled
					? 'bg-slate-50'
					: ''}"
			>
				<div class="flex items-center gap-2 truncate">
					<span class="text-[#ad5389] flex-shrink-0">📄</span>

					{#if typeof value === 'string'}
						<button
							type="button"
							onclick={() => window.open(value, '_blank')}
							class="text-slate-700 text-sm font-semibold truncate hover:text-[#ad5389] transition-colors cursor-pointer flex items-center gap-1"
						>
							View Document <ExternalLink size={12} />
						</button>
					{:else}
						<span class="text-slate-700 text-sm font-semibold truncate">
							{value.name}
						</span>
					{/if}
				</div>

				{#if !isDisabled}
					<button
						type="button"
						onclick={removeFile}
						class="text-slate-400 hover:text-red-500 transition-colors text-sm font-medium cursor-pointer flex items-center gap-1"
					>
						<Trash2 size={14} /> Remove
					</button>
				{/if}
			</div>
		{/if}

		{#if isDisabled}
			<div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
				<Lock size={14} />
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
</div>
