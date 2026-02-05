<script>
	import { goto } from '$app/navigation';
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Table from '$lib/components/Table.svelte';
	import { toast } from '$lib/state/toastData.svelte';
	import { Edit, Loader, Plus, Search, X } from 'lucide-svelte';

	// State Management
	let value = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let rows = $state([]);
	let loading = $state(false);
	let selectedAgent = $state({}); // To hold details for a popup if needed

	// Derived States
	const hasNextPage = $derived(currentPage < totalPages);

	let columns = [
		{ key: 'name', label: 'Name', isImportant: true },
		{ key: 'phoneNumber', label: 'Number', hasCopy: true },
		{ key: 'hospitalId', label: 'Hospital' },
		{ key: 'email', label: 'Email', hasCopy: true, hasEdit: true }
	];

	async function loadData() {
		// loading = true;
		const isSearch = value.trim().length > 0;

		// Define endpoints based on search presence
		const endpoint = isSearch ? `/api/agents/{${value.trim()}` : '/api/get_agents';

		let params = new URLSearchParams({
			page: String(currentPage),
			limit: '10'
		});

		try {
			const response = await fetch(`${PUBLIC_BASE_URL}${endpoint}?${params.toString()}`, {
				method: 'GET',
				credentials: 'include'
			});

			const result = await response.json();

			let incomingData = result.agents || result.data || [];
			if (incomingData.length) {
				incomingData = incomingData.map((hospital) => ({
					...hospital,
					hospital: incomingData?.hospitalId
				}));
			}
			rows = incomingData;
			totalPages = result.totalPages || 1;
		} catch (error) {
			console.error('Failed to fetch agents:', error);
			toast.update('Error', 'server error', 'failed');
			rows = [];
		} finally {
			// loading = false;
		}
	}

	// Handlers
	function handleInput() {
		currentPage = 1; // Reset to page 1 on search
	}

	function onPageChange(newPage) {
		currentPage = newPage;
	}

	function onAddAgent() {
		goto('/pages/forms/add_agent');
	}

	// Reactive Trigger
	$effect(() => {
		// Automatically re-fetch whenever currentPage or search value changes
		loadData();
	});
</script>

<div class="relative flex flex-col w-full p-4 lg:p-6">
	<div
		class="flex flex-col lg:flex-row lg:items-stretch justify-between px-2 lg:px-8 py-2 lg:py-4 border-b border-slate-200 bg-white gap-4 lg:gap-0"
	>
		<div class="flex flex-col gap-3 w-full lg:max-w-md">
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
				Agents
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
					placeholder="Search by email, phone, name..."
					class="w-full bg-slate-100/50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:bg-white focus:border-slate-300 transition-all text-sm"
				/>
			</div>
		</div>

		<div class="flex items-center lg:self-end w-full lg:w-auto">
			<button
				onclick={onAddAgent}
				class="w-full lg:w-auto shrink-0 flex gap-3 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-3 px-6 text-white rounded-2xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all group"
			>
				<span class="text-sm">Add Agent</span>
				<Plus size={18} class="group-hover:rotate-90 transition-transform duration-300" />
			</button>
		</div>
	</div>

	<div class="overflow-x-auto lg:overflow-x-hidden">
		<Table {columns} {rows} bind:selectedHospital={selectedAgent} />
		{@render Pagination({
			currentPage,
			hasNextPage,
			onPageChange
		})}
	</div>
</div>

{#snippet Pagination({ currentPage, hasNextPage, onPageChange })}
	<div class="w-full flex justify-center py-10">
		<div
			class="flex items-center bg-white border border-slate-200 rounded-full shadow-sm px-2 py-1"
		>
			<div class="min-w-[70px] flex justify-center">
				{#if currentPage > 1}
					<button
						onclick={() => onPageChange(currentPage - 1)}
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
				<span class="text-sm font-bold text-slate-800">{currentPage}</span>
			</div>
			<div class="h-4 w-[1px] bg-slate-100"></div>

			<div class="min-w-[70px] flex justify-center">
				{#if hasNextPage}
					<button
						onclick={() => onPageChange(currentPage + 1)}
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
