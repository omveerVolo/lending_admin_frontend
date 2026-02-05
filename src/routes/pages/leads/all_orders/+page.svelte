<script>
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Select from '$lib/components/UI/Select.svelte';
	import { toast } from '$lib/state/toastData.svelte';

	import { ChevronRight, Copy, Edit, FolderClosed, Loader, Plus, Search, X } from 'lucide-svelte';

	let page = $state(1);
	let card = true;
	let rows = $state([]);
	let currentPage = $state(1);
	let value = $state('');
	let loading = $state(false);
	let popupData = $state(null);
	let totalPages = $state(1);
	let expandedIndex = $state(null);
	let closure_resaon = $state('');
	let closure_description = $state('');
	let buttonActive = $state(false);
	let popup_reasons = $state([
		{ label: 'Case Rejected By Credit', value: 'case_rejected_by_credit' },
		{ label: 'Withdrawn-Treatment Cancelled', value: 'withdrawn_treatment_cancelled' },
		{
			label: 'Withdrawn-Required Limit Not Approved',
			value: 'withdrawn_required_limit_not_approved'
		},
		{ label: 'Withdrawn-Processing Issues', value: 'withdrawn_processing_issues' },
		{ label: 'Withdrawn-Others', value: 'withdrawn_others' },
		{ label: 'Withdrawn-Not Interested', value: 'withdrawn_not_interested' },
		{ label: 'Other', value: 'other' }
	]);
	function handleInput() {
		currentPage = 1;
	}
	function onPageChange(newPage) {
		currentPage = newPage;
	}
	async function handleClosure() {
		buttonActive = true;
		try {
			// const token = getCookie('admin_jwt');
			const res = await fetch(`${PUBLIC_BASE_URL}/api/order/closure`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					orderId: popupData._id,
					orderType: popupData.orderType,
					reason: closure_description ? `${closure_resaon}(${closure_description})` : closure_resaon
					// comment,
				})
			});
			const data = await res.json();
			if (res.ok) {
				toast.update('Success', 'order closed', 'success');
			} else {
				toast.update('Error', data.message, 'failed');
				// alert(data.message || 'Error');
			}
		} catch (e) {
			toast.update('Error', e, 'failed');
			// alert('Server error');
			// console.error(e);
		} finally {
			buttonActive = false;
			closure_description = '';
			closure_resaon = '';
		}
	}
	const orderConfig = [
		{
			label: 'Order ID',
			key: '_id',
			width: '180px', // Increased for long IDs (e.g., UUIDs or MongoIDs)
			display: 'always',
			type: 'text',
			hasCopy: true
		},
		{
			label: 'Order Type',
			key: 'orderType',
			width: '140px', // Standardized for types like "Re-finance" or "Fresh Loan"
			display: 'always',
			type: 'text'
		},
		{
			label: 'Hospital',
			key: 'hospitalName',
			width: '300px', // Use fixed or large minmax for long names to avoid collision
			display: 'always',
			type: 'text'
		},
		{
			label: 'Borrower',
			key: 'borrowerName',
			width: '200px', // Names can be long
			display: 'desktop',
			type: 'text',
			isImportant: true
		},
		{
			label: 'Disbursed',
			key: 'disbursedAmount',
			width: '130px', // Enough for "$1,000,000.00"
			display: 'always',
			type: 'amount'
		},
		{
			label: 'Status',
			key: 'status',
			width: '140px', // Badges need width for padding
			display: 'always',
			type: 'status_badge'
		},
		{
			label: 'Order status',
			key: 'order_status',
			width: '140px',
			display: 'always',
			type: 'status_badge'
		},
		{
			label: 'Created At',
			key: 'created_at',
			width: '120px', // Fits "DD/MM/YYYY" comfortably
			display: 'desktop',
			type: 'date'
		},
		{
			label: 'Order Closure',
			key: 'order_closure',
			width: '150px', // Space for the action button
			display: 'always',
			type: 'action_button',
			buttonLabel: 'Close Order',
			onclick: (row) => {
				return;
			}
		}
	];

	$effect(async () => {
		loadData();
	});

	async function loadData() {
		const isSearch = value.trim().length > 0;

		let params = new URLSearchParams({
			page: String(currentPage),
			limit: '10'
		});
		if (isSearch) {
			loading = true;
			params.append('search', value);
			// params.append('context', 'hospital');
		}
		try {
			const response = await fetch(`${PUBLIC_BASE_URL}/api/allOrders??${params.toString()}`, {
				method: 'GET',
				credentials: 'include'
			});

			let { orders, totalPages: pageCount } = await response.json();
			orders = orders.map((order) => ({
				...order,
				created_at: order.created_at
					? new Date(order.created_at).toLocaleDateString().split('T')[0]
					: 'N/A',
				order_status: order.status.leadStatus,
				order_closure: order.OrderClosure || false,
				status: order.status?.esStatus || 'N/A',
				disbursedAmount: order.status?.disbursedAmount?.$numberDecimal || 'N/A'
			}));
			totalPages = pageCount || 1;
			console.log(totalPages);
			rows = orders;
		} catch (error) {
			console.error('Fetch failed:', error);
			rows = [];
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col w-full p-6">
	<div
		class="flex flex-col lg:flex-row lg:items-stretch justify-between px-2 lg:px-8 py-2 lg:py-4 border-b border-slate-200 bg-white gap-4 lg:gap-0"
	>
		<div class=" self-start flex flex-col gap-3 w-full max-w-md">
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
				All orders
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
					placeholder="Search by hospital name, Borrower Name"
					class="w-full bg-slate-100/50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:bg-white focus:border-slate-300 transition-all text-sm"
				/>
			</div>
		</div>
		<!-- <div class="flex items-center lg:self-end w-full lg:w-auto">
		<button
			onclick={onboard}
			class="w-full lg:w-auto shrink-0 flex gap-3 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-3 px-6 text-white rounded-2xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all group"
		>
			<span class="text-sm">Add Hospital</span>
			<Plus size={18} class="group-hover:rotate-90 transition-transform duration-300" />
		</button>
	</div> -->
	</div>

	<div class="overflow-x-auto">
		<table
			class=" mt-5 w-full lg:max-w-full border-separate border-spacing-y-2 lg:border-spacing-y-0 border-spacing-x-0"
		>
			{@render tableHeader(orderConfig)}

			<tbody class="before:block before:leading-[0] before:content-['-'] before:text-transparent">
				{#each rows as row, i (i)}
					{@render tableRow(orderConfig, row, i)}

					{#if expandedIndex === i && card}
						<tr>
							<td colspan={orderConfig.length} class="p-0 lg:relative">
								<div
									class="fixed lg:static inset-x-0 top-1/2 -translate-y-1/2 lg:translate-y-0 z-40 lg:z-auto
               w-xs lg:max-w-none lg:w-full mx-auto
                bg-white border lg:border-[#ad5389]/40 shadow-2xl lg:shadow-none
                rounded-none lg:rounded-b-2xl
                flex flex-col max-h-[90vh] lg:max-h-none"
								>
									<div
										class="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100 lg:hidden"
									>
										<span class="text-xs font-bold uppercase tracking-widest text-slate-500"
											>Order Information</span
										>
										<button
											onclick={() => (expandedIndex = null)}
											class="p-2 bg-white rounded-full shadow-sm text-slate-400 active:scale-95"
										>
											<X size={20} />
										</button>
									</div>

									<div
										class="custom-scrollbar overflow-y-auto p-6 lg:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-6"
									>
										{#each orderConfig as col (col.key)}
											{#if col.type === 'action_button'}
												<div
													class="flex flex-col py-6 border-b border-slate-50 lg:border-0 lg:py-0 order-first lg:order-last sm:col-span-2 lg:col-span-1"
												>
													<button
														onclick={(e) => {
															e.stopPropagation();
															expandedIndex = null;
															popupData = row;
														}}
														class="w-full shrink-0 flex gap-3 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-4 px-6 text-white rounded-2xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all shadow-lg"
													>
														<span class="text-sm">Close order</span>
														<FolderClosed size={18} />
													</button>
												</div>
											{:else if row[col.key]}
												<div
													class="flex items-center justify-between py-4 lg:py-0 border-b border-slate-50 lg:border-0"
												>
													<div class="flex flex-col min-w-0">
														<span
															class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1"
														>
															{col.label || col.key}
														</span>
														<span class="text-base font-semibold text-slate-800 break-words">
															{row[col.key]}
														</span>
													</div>

													<div class="flex items-center gap-2 lg:hidden">
														{#if col.hasCopy}
															<button
																onclick={() => navigator.clipboard.writeText(row[col.key])}
																class="p-2 text-slate-400 bg-slate-50 rounded-lg"
															>
																<Copy size={16} />
															</button>
														{/if}
													</div>
												</div>
											{/if}
										{/each}
									</div>
								</div>

								<div
									role="presentation"
									onclick={() => (expandedIndex = null)}
									class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
								></div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
		{@render Pagination({
			currentPage,
			hasNextPage: currentPage < totalPages,
			onPageChange
		})}
	</div>
</div>
{#if !rows.length}
	{@render noResults()}
{/if}

{#snippet tableHeader(column_data)}
	<thead class="hidden lg:table-header-group">
		<tr class="bg-gray-100">
			{#each column_data as column, i (i)}
				<th
					class="text-left text-slate-500 text-[12px] p-4 font-semibold uppercase first:rounded-tl-2xl last:rounded-tr-2xl"
				>
					{column.label}
				</th>
			{/each}
		</tr>
	</thead>
{/snippet}

{#snippet tableRow(column_data, row, index)}
	<tr
		onclick={() => {
			expandedIndex = expandedIndex === index ? null : index;
		}}
		class="group transition-all cursor-pointer min-w-full
        {expandedIndex === index ? 'bg-slate-50' : 'bg-white'}"
	>
		{#each column_data as column, idx (idx)}
			<td
				class="
                    {column.isImportant ? 'table-cell ' : 'hidden lg:table-cell'} 
                    p-4 transition-all duration-200
                    

                    lg:border-t-1 lg:border-b-1 lg:border-x-0
                    

                    lg:first:border-l-1 lg:last:border-r-1
                    

                    group-hover:border-[#ad5389]/40
                    

                    {expandedIndex === index
					? 'border-y-[#ad5389]/40 border-x-[#ad5389]/40 lg:border-b-transparent'
					: 'border-t-transparent border-x-transparent border-b-slate-100 group-hover:border-b-[#ad5389]/40'}
                    

                    max-lg:border-2 max-lg:rounded-xl
                "
			>
				<div class="flex items-center justify-between gap-4">
					{#if column.type == 'action_button'}
						<div class="flex flex-col truncate">
							<button
								onclick={(e) => {
									e.stopPropagation();
									popupData = row;
								}}
								class="flex-1 lg:w-auto shrink-0 flex gap-2 bg-white text-slate-500 hover:text-red-600 font-bold items-center justify-center py-2 px-4 rounded-2xl border border-slate-200 hover:border-red-600 cursor-pointer transition-all group/two"
							>
								<span class="text-sm">Close order</span>
								<FolderClosed
									size={18}
									class="group-hover:-rotate-45 transition-transform duration-300"
								/>
							</button>
						</div>
					{:else}
						<div class="flex flex-col truncate">
							<span class="truncate text-slate-700 font-semibold lg:font-medium">
								{column.key == '_id'
									? row[column.key]?.length > 10
										? row[column.key].slice(0, 8) + '...'
										: row[column.key]
									: row[column.key] || '—'}
							</span>
						</div>
					{/if}

					<div class="flex items-center gap-2 shrink-0">
						{#if column.hasCopy}
							<button
								onclick={(e) => {
									e.stopPropagation();
									navigator.clipboard.writeText(row[column.key]);
								}}
								class="p-2 -m-2 text-slate-400 hover:text-[#ad5389] cursor-pointer"
							>
								<Copy size={16} />
							</button>
						{/if}

						{#if column.hasEdit}
							<button
								onclick={(e) => {
									e.stopPropagation();
									activateEmailPopUp(row);
								}}
								class="p-2 -m-2 text-slate-400 hover:text-[#ad5389] cursor-pointer"
							>
								<Edit size={16} />
							</button>
						{/if}

						<div class="lg:hidden text-slate-300 ml-1">
							<ChevronRight
								size={18}
								class="transition-transform duration-300 {expandedIndex === index
									? 'rotate-90 text-[#ad5389]'
									: ''}"
							/>
						</div>
					</div>
				</div>
			</td>
		{/each}
	</tr>
{/snippet}
{#if popupData}
	{@render popupClosure(popupData)}
{/if}
<!-- {#snippet popupClosure(row)}
	<div class="fixed inset-0 bg-gray-600/40 flex items-center justify-center p-4">
		<div
			class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200"
		>
			<div class="flex items-center justify-between p-6 pb-4">
				<h2 class="text-3xl font-medium text-gray-800">
					Close Order: <span class="font-normal text-gray-700">{row._id}</span>
				</h2>
				<button
					onclick={() => (popupData = null)}
					class="text-gray-400 hover:text-gray-600 cursor-pointer hover:bg-slate-200 p-2 rounded-full"
				>
					<X size={25} />
				</button>
			</div>

			<div class="px-6 py-4 border-t border-gray-100">
				<label class="block text-xl text-gray-800 mb-3">Reason for Closure</label>

				<Select
					options={popup_reasons}
					value={closure_resaon}
					onUpdate={(selected) => (closure_resaon = selected)}
					disabledIf={() => false}
					error=""
					placeholder={'select any reason'}
				/>
			</div>
			{#if closure_description == 'other'}
				<textarea
					bind:value={closure_description}
					rows="4"
					class="input-style resize-none"
					placeholder={item.placeholder}
				/>
			{/if}

			<div class="flex justify-end gap-4 p-6 border-t border-gray-100 mt-4">
				<button
					class="px-8 py-4 bg-[#cd5c52] text-white font-semibold rounded-lg hover:bg-[#b85049] text-xl transition-colors"
				>
					Submit
				</button>
			</div>
		</div>
	</div>
{/snippet} -->

{#snippet noResults()}
	<div
		class="bg-slate-50 flex items-center justify-center w-full p-6 shadow-inner gap-6 rounded-b-2xl"
	>
		<h1 class="text-slate-400">No results found</h1>
	</div>
{/snippet}

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

{#snippet popupClosure(row)}
	<div
		class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
	>
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex w-md flex-col min-h-[500px]"
		>
			<div class="flex items-center justify-between p-6">
				<div class="flex flex-col">
					<h2 class="text-2xl font-bold text-slate-800">Close Order</h2>
					<p class="text-sm text-slate-500 font-mono mt-1">{row._id}</p>
				</div>
				<button
					onclick={() => {
						((popupData = null), (closure_description = ''));
						closure_resaon = '';
					}}
					class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
				>
					<X size={24} />
				</button>
			</div>

			<div class="px-8 pb-8 flex-1" class:disabled-style={buttonActive}>
				<div class="space-y-6">
					<div>
						<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
							Reason for Closure
						</label>
						<Select
							options={popup_reasons}
							value={closure_resaon}
							onUpdate={(selected) => (closure_resaon = selected)}
							disabledIf={() => false}
							error=""
							placeholder={'Select any reason'}
						/>
					</div>

					{#if closure_resaon === 'other'}
						<div class="animate-in fade-in slide-in-from-top-2">
							<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
								Additional Details
							</label>
							<textarea
								bind:value={closure_description}
								rows="4"
								class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none bg-slate-50"
								placeholder="Please provide more information..."
							></textarea>
						</div>
					{/if}
				</div>
			</div>

			<div
				class="flex items-center justify-around gap-3 p-6 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl"
			>
				<!-- <button
					onclick={() => (popupData = null)}
					class="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
				>
					Cancel
				</button> -->
				<button
					class="group mt-10 mb-10 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white hover:bg-white hover:text-[#ad5389] border hover:border-[#ad5389] transition-all cursor-pointer w-full shadow-lg shadow-blue-900/10"
					onclick={() => handleClosure(row)}
				>
					Submit Closure
				</button>
			</div>
		</div>
	</div>
{/snippet}

<style>
	@reference "tailwindcss";
	.disabled-style {
		@apply !text-slate-300 !bg-slate-50/50 !border-slate-200 cursor-not-allowed;
	}
</style>
