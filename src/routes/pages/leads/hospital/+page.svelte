<script>
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import {
		ArrowRight,
		CheckCircle2,
		CreditCardIcon,
		Edit,
		HospitalIcon,
		Loader,
		Plus,
		Search,
		X
	} from 'lucide-svelte';

	import OnboardingTypeModal from '$lib/components/OnboardingTypeModal.svelte';

	import Table from '$lib/components/Table.svelte';

	import { goto } from '$app/navigation';

	let value = $state('');
	let currentPage = $state(1);
	let isOpenModal = $state(false);
	let rows = $state([]);
	let totalPages = $state(1);
	let selectedHospital = $state({});
	let selectedFormattedHospital = $derived.by(() => {
		if (selectedHospital) {
			return {
				name: selectedHospital?.name || '',
				address: selectedHospital?.address || '',
				city: selectedHospital?.city || '',
				state: selectedHospital?.state || '',
				pincode: selectedHospital?.pincode || '',
				rohini_id: selectedHospital?.rohini_id || '',
				created_by: selectedHospital?.created_by?.name || '',
				relationshipManager: selectedHospital?.relationshipManager?.name || '',
				created_at: selectedHospital?.created_at.split('T')[0] || '',
				annualTurnover: selectedHospital?.annualTurnover || '',
				hospitalCategory: selectedHospital?.hospitalCategory || ''
			};
		}
	});
	let loading = $state(false);

	const hasData = $derived(Object.keys(selectedHospital).length > 0);

	let columns = [
		{ key: 'name', label: 'Hospital Name', isImportant: true },

		{ key: 'address', label: 'Hospital Address' },

		{ key: 'rohini_id', label: 'Rohini Id' },

		{ key: 'city', label: 'City' },

		{ key: 'state', label: 'State' },

		{ key: 'created_at', label: 'Created At' },

		{ key: 'relationship_manager', label: 'Relationship Manager' }
	];
	async function loadData() {
		const isSearch = value.trim().length > 0;
		const endpoint = isSearch ? '/api/search_hospitals' : '/api/get_hospitals';

		let params = new URLSearchParams({
			page: String(currentPage),
			limit: '10'
		});

		if (isSearch) {
			loading = true;
			params.append('query', value);
			params.append('context', 'hospital');
		}

		try {
			const response = await fetch(`${PUBLIC_BASE_URL}${endpoint}?${params.toString()}`, {
				method: 'GET',
				credentials: 'include'
			});

			const result = await response.json();

			let incomingData = result.hospitals || result.data || [];
			if (incomingData.length) {
				incomingData = incomingData.map((hospital) => ({
					...hospital,
					relationship_manager: hospital?.created_by?.name
				}));
			}
			// console.log(incomingData);
			rows = incomingData;
			totalPages = result.totalPages || 1;
		} catch (error) {
			console.error('Fetch failed:', error);
			rows = [];
		} finally {
			loading = false;
		}
	}

	function handleInput() {
		currentPage = 1;
	}

	function clearHospital() {
		selectedHospital = {};
	}

	function onPageChange(newPage) {
		currentPage = newPage;
	}
	function onboard() {
		isOpenModal = true;
	}

	function handleEditHospital() {
		goto(`/pages/forms/edit_hospital/${selectedHospital?._id.toString()}`);
	}

	$effect(() => {
		loadData();
	});
</script>

<div class="flex flex-col w-full p-6">
	{#if hasData}
		{@render HospitalPopupDetailsCard(selectedFormattedHospital, clearHospital)}
	{/if}
	{#if isOpenModal}
		<OnboardingTypeModal isOpenModal={() => (isOpenModal = false)} />
	{/if}
	<div
		class="flex flex-col lg:flex-row lg:items-stretch justify-between px-2 lg:px-8 py-2 lg:py-4 border-b border-slate-200 bg-white gap-4 lg:gap-0"
	>
		<div class="flex flex-col gap-3 w-full max-w-md">
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
				Hospitals
			</span>
			<div class="relative group">
				{#if !loading}
					<Search
						class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ad5389] transition-colors"
						size={18}
					/>
				{:else}
					<Loader
						class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ad5389] transition-colors animate-spin"
						size={18}
					/>
				{/if}

				<input
					oninput={handleInput}
					bind:value
					type="text"
					placeholder="Search by childid,rohiniId or hospital name"
					class="w-full bg-slate-100/50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:bg-white focus:border-slate-300 transition-all text-sm"
				/>
			</div>
		</div>
		<div class="flex items-center lg:self-end w-full lg:w-auto">
			<button
				onclick={onboard}
				class="w-full lg:w-auto shrink-0 flex gap-3 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-3 px-6 text-white rounded-2xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all group"
			>
				<span class="text-sm">Add Hospital</span>
				<Plus size={18} class="group-hover:rotate-90 transition-transform duration-300" />
			</button>
		</div>
	</div>

	<div class="overflow-x-auto lg:overflow-x-hidden">
		<Table {columns} {rows} card={false} bind:selectedHospital />
		{@render Pagination({
			currentPage,
			hasNextPage: currentPage < totalPages,
			onPageChange
		})}
	</div>
</div>

<!-- {#snippet HospitalPopupDetailsCard(selectedHospital, clearHospital)}
	<div
		class="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden w-full max-w-4xl mx-auto mb-6"
	>
		<div class="flex justify-between items-center p-4 border-b">
			<h2 class="text-xl font-bold text-gray-800">Hospital Details</h2>
			<div class="flex items-center gap-4">
				<button
					class="bg-[#6332A0] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-purple-800 transition-colors font-medium"
				>
					<span>✎</span> Edit Hospital
				</button>
				<button
					onclick={() => clearHospital()}
					class="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2"
				>
					&times;
				</button>
			</div>
		</div>

		<div class="divide-y divide-gray-100">
			{#each Object.entries(selectedHospital) as [label, value]}
				<div class="grid grid-cols-3 p-4 items-center">
					<span class="font-bold text-gray-700 capitalize">
						{label.replace(/([A-Z])/g, ' $1')}
					</span>
					<span class="col-span-2 text-gray-600">
						{value || '—'}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/snippet} -->

{#snippet HospitalPopupDetailsCard(selectedHospital, clearHospital)}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40"
	>
		<div
			class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
		>
			<div
				class="shrink-0 flex items-center justify-between px-8 py-5 border-b border-slate-50 bg-white z-20 shadow-md"
			>
				<div class="flex flex-col">
					<h1 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
						Hospital Details
					</h1>
					<p class="text-[10px] text-slate-400">Volo Health Information System</p>
				</div>
				<button
					onclick={() => clearHospital()}
					class="bg-slate-100 rounded-full p-2.5 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
				>
					<X size={16} />
				</button>
			</div>

			<div class="overflow-y-auto px-8 lg:px-12 py-10">
				<div class="space-y-6">
					{#each Object.entries(selectedHospital) as [label, value]}
						{#if ['name', 'address', 'city', 'state', 'pincode', 'rohini_id', 'created_by', 'relationshipManager', 'treatmentSubType', 'created_at'].includes(label)}
							<div class="flex flex-col border-b border-slate-50 pb-4">
								<span
									class="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-semibold mb-1"
								>
									{label.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
								</span>
								<span class="text-slate-700 font-medium break-words">
									{value || '—'}
								</span>
							</div>
						{/if}
					{/each}

					<div class="h-24"></div>
				</div>
			</div>

			<div
				class="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 pointer-events-none"
			>
				<button
					onclick={() => handleEditHospital()}
					class="pointer-events-auto group flex h-[62px] items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-900 transition-all cursor-pointer w-full shadow-lg shadow-slate-900/10"
				>
					<span class="font-semibold text-lg leading-none"> Edit Hospital </span>
					<Edit size={12} />
				</button>
			</div>
		</div>
	</div>
{/snippet}

<!-- {#snippet HospitalPopupDetailsCard(selectedHospital, clearHospital)}
	<div class="w-full relative px-0 lg:px-56 mb-16">
		<button
			onclick={() => clearHospital()}
			class="absolute right-4 top-4 lg:right-[250px] bg-slate-200 rounded-full p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
		>
			<X size={15} />
		</button>

		<div class="w-full bg-white border border-slate-100 rounded-2xl shadow-sm p-8 lg:p-12">
			<div class="w-full flex flex-col items-center mb-10">
				<h1 class="text-lg font-medium uppercase tracking-[0.2em] text-slate-500">
					Hospital Details
				</h1>
				<p class="text-slate-400 text-xs mt-1">Volo Health Information System</p>
			</div>

			<div class="space-y-6">
				{#each Object.entries(selectedHospital) as [label, value]}
					<div class="flex flex-col border-b border-slate-50 pb-4">
						<span class="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-semibold mb-1">
							{label.replace(/([A-Z])/g, ' $1')}
						</span>
						<span class="text-slate-700 font-medium">
							{value || '—'}
						</span>
					</div>
				{/each}
			</div>

			<button
				class="group mt-10 flex h-[62px] items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-900 transition-all cursor-pointer w-full shadow-lg shadow-slate-900/10"
			>
				<span class="font-semibold text-lg leading-none"> Edit Hospital </span>
				<span>✎</span>
			</button>
		</div>
	</div>
{/snippet} -->

{#snippet Pagination({ currentPage, hasNextPage, onPageChange })}
	<div class="w-full flex justify-center py-10">
		<div
			class="flex items-center bg-white border border-slate-200 rounded-full shadow-sm px-2 py-1"
		>
			<div class="min-w-[70px] flex justify-center">
				{#if currentPage > 1}
					<button
						onclick={() => {
							if (currentPage - 1 == 0) {
								return;
							}

							onPageChange(currentPage - 1);
						}}
						class="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#ad5389] transition-all cursor-pointer active:scale-90"
					>
						Prev
					</button>
				{:else}
					<div class="px-3 py-2 opacity-0">Prev</div>
				{/if}
			</div>

			<div class="h-4 w-[1px] bg-slate-100"></div>

			<div class="flex items-center gap-2 px-6">
				<!-- <span class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pg</span> -->
				<span class="text-sm font-bold text-slate-800">{currentPage}</span>
			</div>

			<div class="h-4 w-[1px] bg-slate-100"></div>

			<div class="min-w-[70px] flex justify-center">
				{#if hasNextPage}
					<button
						onclick={() => {
							let newpage = currentPage + 1;
							onPageChange(newpage);
						}}
						class="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#ad5389] transition-all cursor-pointer active:scale-90"
					>
						Next
					</button>
				{:else}
					<div class="px-3 py-2 opacity-0">Next</div>
				{/if}
			</div>
		</div>
	</div>
{/snippet}
