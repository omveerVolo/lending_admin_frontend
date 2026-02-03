<script>
	import { ArrowRight, Plus } from 'lucide-svelte';
	import OptionsCustom from '$lib/components/OptionsCustom.svelte';
	let { data, formData = $bindable({}) } = $props();
</script>

<div class="w-full min-h-dvh bg-gray-100 flex justify-center items-start py-15 px-6">
	<div class="w-full max-w-md flex flex-col">
		<div class="flex flex-col gap-y-6">
			{#each data as field, idx (idx)}
				{#if field.type == 'input'}
					<div class="flex flex-col gap-2 w-full">
						<label class="text-slate-600 font-medium text-sm">{field.label}</label>
						<input
							type="text"
							bind:value={formData[field.name]}
							class="w-full bg-white border border-slate-300 p-4 rounded-2xl outline-none transition-all focus:border-blue-600 focus:bg-white text-slate-700 placeholder:text-slate-300"
							placeholder={field.placeholder}
						/>
					</div>
				{:else if field.type == 'option'}
					<div class="flex flex-col gap-2 w-full">
						<label class="text-slate-600 font-medium text-sm">{field.label}</label>
						<OptionsCustom {field} bind:formData />
					</div>
				{:else if field.type == 'checkbox'}
					<div class="flex items-center gap-3 p-1">
						<input
							type="checkbox"
							id={field.name}
							bind:checked={formData[field.name]}
							class="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
						/>
						<label
							for={field.name}
							class="text-slate-600 font-medium text-sm cursor-pointer hover:text-slate-800 transition-colors"
						>
							{field.label}
						</label>
					</div>
				{:else if field.type == 'file'}
					<div class="flex flex-col gap-2 w-full">
						<label class="text-slate-600 font-medium text-sm">
							{field.label}
							{#if field.required}
								<span class="text-red-500 ml-1">*</span>
							{/if}
						</label>
						<input
							class="hidden"
							id={field.name}
							type="file"
							onchange={(e) => {
								const input = e.target;
								const file = input.files?.[0] ?? null;

								formData = {
									...formData,
									[field.name]: file
								};
							}}
						/>

						{#if !formData[field.name]}
							<label
								for={field.name}
								class="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
							>
								<span class="text-blue-600 font-semibold text-lg">＋</span>
								<span class="text-slate-500 text-sm">Choose file</span>
							</label>
						{:else}
							<div
								class="flex items-center justify-between gap-3 w-full p-4 rounded-2xl border border-slate-300 bg-white"
							>
								<div class="flex items-center gap-2 truncate">
									<span class="text-blue-600">📄</span>
									<span class="text-slate-700 text-sm truncate">{formData[field.name].name}</span>
								</div>

								<button
									type="button"
									onclick={() => (formData = { ...formData, [field.name]: null })}
									class="text-slate-400 hover:text-red-500 transition-colors text-sm cursor-pointer"
								>
									Remove
								</button>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
