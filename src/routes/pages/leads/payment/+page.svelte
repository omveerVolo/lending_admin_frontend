<script>
	import { goto } from '$app/navigation';
	import SelectAndSearch from '$lib/components/SelectAndSearch.svelte';
	import Table from '$lib/components/Table.svelte';
	import CommonForm from '$lib/forms/CommonForm.svelte';
	import {
		ArrowRight,
		CheckCircle2,
		CreditCardIcon,
		HospitalIcon,
		Loader,
		Plus,
		Search,
		X
	} from 'lucide-svelte';

	let value = $state('');
	let loading = $state(false);
	let rows = $state.raw([]);
	let columns = [
		{ key: 'txn_id', label: 'Txn ID' },
		{ key: 'name', label: 'Name', isImportant: true },
		{ key: 'amount', label: 'Amount' },
		{ key: 'status', label: 'Status' },
		{ key: 'hospital', label: 'Hospital' },
		{ key: 'transaction_date', label: 'Transaction Date' },
		{ key: 'action', label: 'Action' }
	];

	function onSubmit() {
		return goto('/pages/forms/add_auth_payment');
	}

	async function fetchAgents(pageNumber) {
		loading = true;
		try {
			const response = await fetch('https://mocki.io/v1/61608378-77a9-42f1-aeaf-24cdda8d2006', {
				method: 'GET'
			});
			console.log();
			const { data } = await response.json();

			if (data && data.length > 0) {
				rows = data;
			}
		} catch (error) {
			console.error('Failed to fetch agents:', error);
		} finally {
			loading = false;
		}
	}

	async function oninput(query) {
		loading = true;
		try {
			const response = await fetch('https://mocki.io/v1/a3f9ebbd-4c57-4f00-b0fa-3551fd2e198b', {
				method: 'GET'
			});
			const { data } = await response.json();
			if (data?.length) {
				rows = data;
			}
		} catch (error) {
			console.error('Failed to fetch agents:', error);
		} finally {
			loading = false;
		}
	}

	function onPageChange(value) {
		return;
	}

	$effect(() => {
		fetchAgents();
	});
</script>

<div class="flex flex-col w-full p-4 lg:p-6">
	<div
		class="flex flex-col lg:flex-row lg:items-stretch justify-between px-2 lg:px-8 py-2 lg:py-4 border-b border-slate-200 bg-white gap-4 lg:gap-0"
	>
		<div class="flex flex-col gap-3 w-full lg:max-w-md overflow-x-hidden">
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
				Pre Auth
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
					{oninput}
					bind:value
					type="text"
					placeholder="Search by email, phone, name..."
					class="w-full bg-slate-100/50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:bg-white focus:border-slate-300 transition-all text-sm"
				/>
			</div>
		</div>

		<div class="flex items-center lg:self-end w-full lg:w-auto">
			<button
				onclick={onSubmit}
				class="w-full lg:w-auto shrink-0 flex gap-3 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-3 px-6 text-white rounded-2xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all group"
			>
				<span class="text-sm">Add Pre Auth</span>
				<Plus size={18} class="group-hover:rotate-90 transition-transform duration-300" />
			</button>
		</div>
	</div>
	<div class="overflow-x-auto lg:overflow-x-hidden">
		<Table {columns} {rows} />
		{@render Pagination({ currentPage: 1, hasNextPage: true, onPageChange })}
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
				<!-- <span class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pg</span> -->
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
