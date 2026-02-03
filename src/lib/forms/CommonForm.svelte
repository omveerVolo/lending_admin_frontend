<script>
	import NormalSelect from '$lib/components/NormalSelect.svelte';
	import SelectAndSearch from '$lib/components/SelectAndSearch.svelte';
	import { Plus, Trash2, X } from 'lucide-svelte';

	import { fade, fly, slide } from 'svelte/transition';

	let {
		items = [],
		formData = $bindable({}),
		errors = $bindable({}),
		submitButton,
		formTitle
	} = $props();
	const BACKEND_MAP = {
		onboardedFibe: {
			mid: 'lendingMid',
			priority: 'fibePriority',
			typeKey: 'fibe'
		},
		onboardedPayU: {
			mid: 'payuMid',
			priority: 'PayUPriority',
			typeKey: 'payu'
		},
		onboardedRazorPay: {
			mid: 'razorpayMid',
			priority: 'raorpayPriority',
			typeKey: 'razorpay'
		},
		'onboardedEmfyn/zype': {
			mid: 'emfynMid',
			priority: 'emfynPriority',
			typeKey: 'emfyn'
		}
	};
	let providerData = $state({
		onboardedFibe: {
			mid: '',
			priority: 1
		},
		onboardedPayU: {
			mid: '',
			priority: 1
		},
		onboardedRazorPay: {
			mid: '',
			priority: 1
		},
		'onboardedEmfyn/zype': {
			mid: '',
			priority: 1
		},
		schemes: { fibe: [], payu: [], razorpay: [], emfyn: [] }
	});
	$inspect(providerData);
	$inspect(formData);

	//realtion ship amanger page
	//TODO: allorders talble row will have a button at the end that when pressed will trigger a dialog for closure reason
	//TODO : filter on TABLE fields , status and created at orderALL
	//TODO: Hospital Login will have button at SSO login that will direct them to HOSPITAL portal

	//TODO:end button in resimburement is INGEST
	//TODO: 2nd last field have input values

	let fieldRefs = $state({});
	let debounceTimer;

	function handleInput(e, item) {
		const value = e.target.value;
		if (errors[item.name]) {
			errors[item.name] = undefined;
		}

		const isInstant = item.type === 'pincode' || item.type === 'checkbox';

		const runValidation = async () => {
			if (item.verify_onchange) {
				const result = await item.verify_onchange(value, formData);
				if (result) {
					console.log(result);
					errors[item.name] = result;
				}
			}

			if (item.required && value === '') {
				errors[item.name] = 'This field is required';
			}
		};

		if (isInstant) {
			runValidation();
		} else {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(runValidation, 700);
		}
	}
	function removeScheme(type, index) {
		switch (type) {
			case 'onboardedPayU':
				providerData.schemes.payu.splice(index, 1);
				break;

			case 'onboardedEmfyn/zype':
				providerData.schemes.emfyn.splice(index, 1);
				break;

			case 'onboardedRazorPay':
				providerData.schemes.razorpay.splice(index, 1);
				break;

			case 'onboardedFibe':
				providerData.schemes.fibe.splice(index, 1);
				break;

			default:
				console.warn(`Unknown provider type: ${type}`);
				return;
		}
	}
	function addScheme(type) {
		switch (type) {
			case 'onboardedPayU':
				return providerData.schemes.payu.push({
					schemeId: '',
					schemeCode: '',
					subvention: 0,
					pf: 0,
					interestRate: null,
					netIrr: null
				});
			case 'onboardedEmfyn/zype':
				return providerData.schemes.emfyn.push({
					schemeId: '',
					schemeCode: '',
					subvention: 0,
					pf: 0,
					interestRate: null,
					netIrr: null
				});
			case 'onboardedRazorPay':
				return providerData.schemes.razorpay.push({
					schemeId: '',
					schemeCode: '',
					subvention: 0,
					pf: 0,
					interestRate: null,
					netIrr: null
				});
			case 'onboardedFibe':
				return providerData.schemes.fibe.push({
					schemeId: '',
					schemeCode: '',
					subvention: 0,
					pf: 0,
					interestRate: null,
					netIrr: null
				});
			default:
				return;
		}
	}
	export const scrollToFirstError = () => {
		const errorFields = Object.keys(errors).filter((key) => errors[key]);

		if (errorFields.length > 0) {
			document.getElementById('hospital_form').scrollIntoView({ y: 0 });
		}
	};

	import { untrack } from 'svelte';
	import Divider from '$lib/components/UI/Divider.svelte';
	$effect(() => {
		const _trackData = $state.snapshot(providerData);
		const _trackCheckboxes = {
			fibe: formData.onboardedFibe,
			payu: formData.onboardedPayU,
			razorpay: formData.onboardedRazorPay,
			emfyn: formData['onboardedEmfyn/zype']
		};

		untrack(() => {
			if (!formData.schemes) formData.schemes = {};

			Object.entries(BACKEND_MAP).forEach(([checkboxKey, mapping]) => {
				const isSelected = formData[checkboxKey];
				const providerInfo = providerData[checkboxKey];

				// Always sync schemes
				formData.schemes[mapping.typeKey] = $state.snapshot(providerData.schemes[mapping.typeKey]);

				if (isSelected) {
					// Sync MID and Priority
					formData[mapping.mid] = providerInfo.mid;
					formData[mapping.priority] = providerInfo.priority;
				} else {
					delete formData.schemes[mapping.typeKey];
					delete formData[mapping.mid];
					delete formData[mapping.priority];
				}
			});
		});
	});
	$effect(() => {
		Object.keys(providerData).forEach((key) => {
			if (providerData[key].priority < 1) {
				providerData[key].priority = 1;
			}
		});
	});
</script>

<div
	class="w-full min-h-screen bg-gray-100 flex justify-center items-start py-10 px-6 overflow-y-auto touch-pan-y"
>
	<div class=" w-full max-w-md lg:max-w-full flex flex-col lg:items-stretch">
		{#if formTitle}
			{@render formTitle()}
		{/if}

		<div class="flex flex-col gap-y-4">
			{#each items as item, i (i)}
				<div class="flex flex-col gap-2 w-full" bind:this={fieldRefs[item.name]}>
					{#if item.type === 'pincode' || item.type === 'phone'}
						{@const isDisabled = item.disabledIf ? item.disabledIf(formData) : false}
						{@render FieldLabel(item.label)}
						<input
							bind:this={fieldRefs[item.name]}
							oninput={(e) => {
								handleInput(e, item);
							}}
							disabled={isDisabled}
							type="number"
							min={0}
							maxlength={item.type === 'pincode' ? 6 : 10}
							placeholder={item.placeholder}
							bind:value={formData[item.name]}
							class={`input-style ${isDisabled ? 'cursor-not-allowed' : ''}`}
						/>
						{@render errorSnippet(errors[item.name])}
					{:else if item.type === 'number'}
						{@const isDisabled = item.disabledIf ? item.disabledIf(formData) : false}
						{@render FieldLabel(item.label)}
						<input
							bind:this={fieldRefs[item.name]}
							oninput={(e) => handleInput(e, item)}
							type="number"
							disabled={isDisabled}
							placeholder={item.placeholder}
							maxlength={item.type === 'pincode' ? 6 : 10}
							bind:value={formData[item.name]}
							class={`input-style ${isDisabled ? 'cursor-not-allowed' : ''}`}
						/>
						{@render errorSnippet(errors[item.name])}
					{:else if item.type === 'email'}
						{@const isDisabled = item.disabledIf ? item.disabledIf(formData) : false}
						{@render FieldLabel(item.label)}
						<input
							oninput={(e) => handleInput(e, item)}
							bind:this={fieldRefs[item.name]}
							type="email"
							disabled={isDisabled}
							bind:value={formData[item.name]}
							class={`input-style ${isDisabled ? 'cursor-not-allowed' : ''}`}
							placeholder={item.placeholder}
						/>
						{@render errorSnippet(errors[item.name])}
					{:else if item.type == 'checkbox'}
						{@const isDisabled = item.disabledIf ? item.disabledIf(formData) : false}

						<div
							class="relative flex w-full flex-col gap-2 rounded-xl border-2 transition-all duration-300 p-4 cursor-pointer group
    {isDisabled
								? 'border-slate-100 bg-slate-50 opacity-60 grayscale-[0.5] select-none'
								: formData[item.name]
									? 'border-[#ad5389] bg-blue-50/50 shadow-sm'
									: 'border-slate-200 bg-white hover:border-slate-300'}"
						>
							{#if isDisabled}
								<div class="absolute inset-0 z-10 cursor-not-allowed"></div>
							{/if}

							<div class="flex items-center gap-4">
								<div class="relative flex items-center justify-center">
									<input
										bind:this={fieldRefs[item.name]}
										oninput={(e) => handleInput(e, item)}
										type="checkbox"
										id={item.name}
										bind:checked={formData[item.name]}
										disabled={isDisabled}
										class="peer h-6 w-6 appearance-none rounded-md border-2 cursor-pointer border-slate-300 bg-white transition-all
                checked:border-[#ad5389] checked:bg-[#ad5389] focus:outline-none focus:ring-2 focus:ring-[#ad5389]focus:ring-offset-2
                disabled:border-slate-200 disabled:bg-slate-100"
									/>
									<svg
										class="pointer-events-none absolute h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="4"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
								</div>

								<label
									for={item.name}
									class="flex-1 select-none text-sm font-semibold transition-colors
            {isDisabled
										? 'text-slate-400'
										: formData[item.name]
											? 'text-blue-900'
											: 'text-slate-400'}"
								>
									{item.label}
									{#if isDisabled}
										<span
											class="block text-[10px] font-normal uppercase tracking-wider text-slate-400 mt-0.5"
										>
											using Parent hospital data
										</span>
									{/if}
								</label>
							</div>

							{#if formData[item.name] && !isDisabled}
								<div
									class="relative mt-5 flex flex-col border-t border-slate-100 pt-5 bg-white rounded-xl"
								>
									<div class="">
										{@render mid_details(item)}

										<!-- {@render divider()} -->
										{@render titleAndAddScheme(addScheme, item.name || '', item.name)}
										<!-- {@render divider()} -->
										<div class="border border-slate-400 rounded-2xl">
											{#if item.name == 'onboardedFibe'}
												{#each providerData.schemes.fibe as scheme, i (i)}
													{@render scheme_card(scheme, removeScheme, i, item.name)}
													<!-- {@render divider()} -->
												{/each}
											{:else if item.name == 'onboardedPayU'}
												{#each providerData.schemes.payu as scheme, i (i)}
													{@render scheme_card(scheme, removeScheme, i, item.name)}
													<!-- {@render divider()} -->
												{/each}
											{:else if item.name == 'onboardedEmfyn/zype'}
												{#each providerData.schemes.emfyn as scheme, i (i)}
													{@render scheme_card(scheme, removeScheme, i, item.name)}
													<!-- {@render divider()} -->
												{/each}
											{:else if item.name == 'onboardedRazorPay'}
												{#each providerData.schemes.razorpay as scheme, i (i)}
													{@render scheme_card(scheme, removeScheme, i, item.name)}
													<!-- {@render divider()} -->
												{/each}
											{:else}
												{null}
											{/if}
										</div>
									</div>
								</div>
							{/if}
						</div>

						{@render errorSnippet(errors[item.name])}
					{:else if item.type === 'select_search'}
						{@const isDisabled = item.disabledIf ? item.disabledIf(formData) : false}
						{@render FieldLabel(item.label)}

						<SelectAndSearch
							{errors}
							{item}
							{formData}
							{isDisabled}
							onchange={() => (errors[item.name] = undefined)}
						/>
						{@render errorSnippet(errors[item.name])}
					{:else if item.type === 'select'}
						{@const isDisabled = item.disabledIf ? item.disabledIf(formData) : false}
						{@render FieldLabel(item.label)}
						<NormalSelect
							{errors}
							{item}
							bind:formData
							{isDisabled}
							onchange={() => (errors[item.name] = undefined)}
						/>
						{@render errorSnippet(errors[item.name])}
					{:else if item.type === 'textarea'}
						{@render FieldLabel(item.label)}
						<textarea
							bind:this={fieldRefs[item.name]}
							bind:value={formData[item.name]}
							rows="4"
							oninput={(e) => handleInput(e, item)}
							class="input-style resize-none"
							placeholder={item.placeholder}
						/>
						{@render errorSnippet(errors[item.name])}
					{:else if item.type == 'file'}
						<div class="flex gap-2 flex-col">
							{@render FieldLabel(item.label)}
							<input
								bind:this={fieldRefs[item.name]}
								class="hidden"
								id={item.name}
								type="file"
								onchange={(e) => {
									const file = e.target.files?.[0] ?? null;
									if (!file) return;

									// 1. Size Check
									const maxSize = 5 * 1024 * 1024;
									if (file.size > maxSize) {
										errors[item.name] = 'File too large (Max 5MB)';
										e.target.value = '';
										return;
									}

									// 2. Type Check
									if (item.name === 'msaAgreement') {
										const docxType =
											'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
										const isDocx =
											file.type == 'application/pdf' ||
											file.type === docxType ||
											file.name.toLowerCase().endsWith('.docx');
										if (!isDocx) {
											errors[item.name] = 'Only Docx or PDF files allowed';
											e.target.value = '';
											return;
										}
									} else {
										// Only run PDF check if it's NOT the msaAgreement
										if (file.type !== 'application/pdf') {
											errors[item.name] = 'Only PDF files allowed';
											e.target.value = '';
											return;
										}
									}

									// 3. Success
									formData[item.name] = file;
									errors[item.name] = undefined;
								}}
							/>

							{#if !formData[item.name]}
								<label
									for={item.name}
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
										<span class="text-slate-700 text-sm truncate"
											>{formData[item.name].name.trim(15)}</span
										>
									</div>

									<button
										type="button"
										onclick={() => (formData = { ...formData, [item.name]: null })}
										class="text-slate-400 hover:text-red-500 transition-colors text-sm cursor-pointer"
									>
										Remove
									</button>
								</div>
							{/if}
							{@render errorSnippet(errors[item.name])}
						</div>
					{:else}
						{@const isDisabled = item.disabledIf ? item.disabledIf(formData) : false}
						{@render FieldLabel(item.label)}
						<input
							bind:this={fieldRefs[item.name]}
							oninput={(e) => handleInput(e, item)}
							type="text"
							bind:value={formData[item.name]}
							class={`input-style ${isDisabled ? 'cursor-not-allowed' : ''}`}
							placeholder={item.placeholder}
							disabled={isDisabled}
						/>
						{@render errorSnippet(errors[item.name])}
					{/if}
				</div>
			{/each}
		</div>

		{#if submitButton}
			{@render submitButton()}
		{/if}
	</div>
</div>

{#snippet errorSnippet(value)}
	<div class="h-4 overflow-hidden">
		{#if value}
			<span
				transition:fly={{ y: -5, duration: 200 }}
				class="text-rose-500 text-xs font-normal ml-2 block"
			>
				{value}
			</span>
		{/if}
	</div>
{/snippet}

{#snippet FieldLabel(value)}
	<label class="text-slate-400 font-medium text-sm">{value}</label>
{/snippet}
{#snippet titleAndAddScheme(addScheme, title, type)}
	<div class="flex items-center justify-between bg-slate-50 p-3 rounded-t-xl">
		<h3 class="text-xs uppercase tracking-widest text-slate-700">{title}</h3>
		<button
			class="group flex items-center gap-2 px-4 py-2 bg-black hover:bg-white border border-transparent rounded-xl text-[10px] font-bold text-slate-300 uppercase tracking-widest transition-all duration-300 cursor-pointer hover:text-[#ad5389] hover:border-[#ad5389] hover:bg-slate-900"
			onclick={() => addScheme(type)}
		>
			<Plus size={14} strokeWidth={3} />
			Add Scheme
		</button>
	</div>
{/snippet}

{#snippet mid_details(item)}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 px-4 md:px-10 mb-6">
		<div class="flex flex-col gap-2">
			<label class="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1"
				>Merchant MID</label
			>
			<input
				bind:value={providerData[item.name].mid}
				placeholder="Enter MID"
				class="w-full bg-white border border-slate-200 font-semibold rounded-lg text-slate-500 p-3 text-xs outline-none focus:border-[#ad5389] transition-all"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1"
				>Priority</label
			>
			<div class="relative flex items-center">
				<input
					type="number"
					min="1"
					bind:value={providerData[item.name].priority}
					class="w-full bg-white border border-slate-200 font-semibold rounded-lg text-slate-500 p-3 pr-20 text-xs outline-none focus:border-[#ad5389] transition-all"
				/>

				{#if providerData[item.name].priority == 1}
					<span
						class="absolute right-2 px-2 py-1 bg-[#ad5389]/10 text-[#ad5389] text-[10px] uppercase rounded-md pointer-events-none"
					>
						Highest
					</span>
				{:else if providerData[item.name].priority > 1}
					<span
						class="absolute right-2 px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold uppercase rounded-md pointer-events-none"
					>
						Rank {providerData[item.name].priority}
					</span>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet mid_details_fibe(item)}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 px-4 md:px-10 mb-6">
		<div class="flex flex-col gap-2">
			<label class="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1"
				>Lending MID</label
			>
			<input
				bind:value={providerData[item.name].lendingMid}
				placeholder="Enter MID"
				class="w-full bg-white border border-slate-200 font-semibold rounded-lg text-slate-500 p-3 text-xs outline-none focus:border-[#ad5389] transition-all"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1"
				>Reimbursement MID</label
			>
			<input
				bind:value={providerData[item.name].reimbursementMid}
				placeholder="Enter ID"
				class="w-full bg-white border border-slate-200 font-semibold rounded-lg p-3 text-slate-500 text-xs outline-none focus:border-[#ad5389] transition-all"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1"
				>Priority</label
			>
			<div class="relative flex items-center">
				<input
					type="number"
					min="1"
					bind:value={providerData[item.name].priority}
					class="w-full bg-white border border-slate-200 font-semibold text-slate-500 rounded-lg p-3 pr-20 text-xs outline-none focus:border-[#ad5389] transition-all"
				/>

				{#if providerData[item.name].priority == 1}
					<span
						class="absolute right-2 px-2 py-1 bg-[#ad5389]/10 text-[#ad5389] text-[10px] uppercase rounded-md pointer-events-none"
					>
						Highest
					</span>
				{:else if providerData[item.name].priority > 1}{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet scheme_card(scheme, removeAction, schemeIndex, lenderType)}
	<div
		class="py-8 group border-b-4 border-slate-100 last:border-0 mx-auto w-full max-w-7xl px-4 md:px-8"
	>
		<div class="flex items-center justify-between mx-8 mb-6">
			<div class="flex items-center gap-2 bg-gray-50 rounded-2xl">
				<span class="text-[10px] text-slate-500 uppercase tracking-[0.2em]">
					Scheme {schemeIndex + 1}
				</span>
			</div>

			<button
				onclick={() => removeAction(lenderType, schemeIndex)}
				class="group flex items-center gap-2 px-4 py-2 bg-black hover:bg-white border border-transparent rounded-xl text-[10px] font-bold text-slate-300 uppercase tracking-widest transition-all duration-300 cursor-pointer hover:text-[#ad5389] hover:border-[#ad5389] hover:bg-slate-900"
			>
				<Trash2 size={14} class="transition-transform group-hover:scale-110" />
				<span>Remove</span>
			</button>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 px-2">
			{#each [{ l: 'Scheme ID', k: 'schemeId', p: '—' }, { l: 'Code', k: 'schemeCode', p: '3/0' }, { l: 'Subvention', k: 'subvention', p: '0.00' }, { l: 'PF', k: 'pf', p: '0.00' }, { l: 'Interest', k: 'interestRate', p: 'Value' }, { l: 'Net IRR', k: 'netIrr', p: 'Value' }] as { l, k, p }}
				<div class="flex flex-col gap-2">
					<label class="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
						{l}
					</label>
					<input
						bind:value={scheme[k]}
						placeholder={p}
						class="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs outline-none focus:border-[#ad5389] transition-all"
					/>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet divider()}
	<div class="min-h-[4px] mx-5 bg-slate-200 mt-3"></div>
{/snippet}

<style>
	@reference "tailwindcss";
	.input-style {
		@apply w-full bg-white border border-slate-300 p-4 rounded-2xl outline-none 
               transition-all focus:border-[#ad5389] focus:bg-white text-slate-500 
               placeholder:text-slate-300 font-medium;
	}
</style>
