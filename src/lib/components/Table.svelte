<script>
	import { ChevronRight, Copy, Edit, X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';

	let { rows = [], columns, card = true, selectedHospital = $bindable({}) } = $props();

	let isLargeScreen = $state(false);
	let expandedIndex = $state(null);

	let isEmailEdit = $state(false);
	let activeEmailEditData = $state({});

	function activateEmailPopUp(row) {
		expandedIndex = null;
		isEmailEdit = true;
		activeEmailEditData = row;
	}
	function onEmailSubmit() {
		isEmailEdit = !isEmailEdit;
		activeEmailEditData = {};
	}
	function closeEmailPopup() {
		isEmailEdit = false;
		activeEmailEditData = {};
	}

	$effect(() => {
		const media_query = window.matchMedia(`(min-width: 1024px)`);
		isLargeScreen = media_query.matches;
		const handler = (e) => (isLargeScreen = e.matches);
		media_query.addEventListener('change', handler);
		return () => media_query.removeEventListener('change', handler);
	});
</script>

{#if isEmailEdit}
	{@render popupEmailEdit(activeEmailEditData, onEmailSubmit, closeEmailPopup)}
{/if}

<table
	class="w-full mt-5 max-w-full lg:table-fixed border-separate border-spacing-y-2 lg:border-spacing-y-0 border-spacing-x-0"
>
	{@render tableHeader(columns)}

	<tbody class="before:block before:leading-[0] before:content-['-'] before:text-transparent">
		{#each rows as row, i (i)}
			{@render tableRow(columns, row, i)}

			{#if expandedIndex === i && card}
				<tr>
					<td colspan={columns.length} class="p-0 lg:relative">
						<div
							class="fixed lg:static inset-x-4 top-1/2 -translate-y-1/2 lg:translate-y-0 lg:inset-x-0 z-40 lg:z-auto
                    bg-white p-6 lg:p-8 border lg:border-[#ad5389]/40 border-[#ad5389]/0 lg:border-t-0 shadow-2xl lg:shadow-none
                    rounded-3xl lg:rounded-none lg:rounded-b-2xl
                    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8"
						>
							<button
								onclick={() => (expandedIndex = null)}
								class="absolute block lg:hidden right-4 top-4 p-2"
							>
								<X class="text-slate-400" size={20} />
							</button>

							{#each columns as col (col.key)}
								{#if row[col.key]}
									<div
										class="flex items-center justify-between py-2 lg:py-0 border-b border-slate-50 lg:border-0"
									>
										<span class="text-sm lg:text-sm font-medium text-slate-700 break-words">
											{#if row[col.key]}
												{row[col.key]}
											{:else}
												{'Empty'}
											{/if}
										</span>

										<div class="flex items-center gap-3 lg:hidden">
											{#if col.hasCopy && row[col.key]}
												<button
													onclick={() => navigator.clipboard.writeText(row[col.key])}
													class="text-slate-400 active:text-blue-600 p-2"
												>
													<Copy size={16} />
												</button>
											{/if}

											{#if col.hasEdit}
												<button
													onclick={() => activateEmailPopUp(row)}
													class="text-slate-400 active:text-blue-600 p-2"
												>
													<Edit size={16} />
												</button>
											{/if}
										</div>
									</div>
								{/if}
							{/each}
						</div>

						<div
							role="presentation"
							onclick={() => (expandedIndex = null)}
							class="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-30 lg:hidden"
						></div>
					</td>
				</tr>
			{/if}
		{/each}
	</tbody>
</table>

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

<!-- {#snippet tableRow(column_data, row, index)}
	<tr
		onclick={() => {
			selectedHospital = row;
			expandedIndex = expandedIndex === index ? null : index;
		}}
		class="group transition-all cursor-pointer
        {expandedIndex === index ? 'bg-slate-50' : 'bg-white'}"
	>
		{#each column_data as column, idx (idx)}
			<td
				class="
                    {column.isImportant ? 'table-cell' : 'hidden lg:table-cell'} 
                    p-4 border-y transition-all
                    max-lg:border-x-2 max-lg:rounded-xl
                    lg:border-y-0 lg:border-b lg:border-t lg:border-slate-100
                    lg:first:border-l-2 lg:last:border-r-2 lg:border-transparent
                    group-hover:border-[#ad5389]/40
                    {expandedIndex === index ? 'border-[#ad5389]/40 ' : 'border-slate-100'}
                "
			>
				<div class="flex items-center justify-between gap-4">
					<div class="flex flex-col truncate">
						<span class="truncate text-slate-700 font-semibold lg:font-medium">
							{row[column.key] || '—'}
						</span>
					</div>

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
{/snippet} -->

{#snippet tableRow(column_data, row, index)}
	<tr
		onclick={() => {
			selectedHospital = row;
			expandedIndex = expandedIndex === index ? null : index;
		}}
		class="group transition-all cursor-pointer
        {expandedIndex === index ? 'bg-slate-50' : 'bg-white'}"
	>
		{#each column_data as column, idx (idx)}
			<td
				class="
                    {column.isImportant ? 'table-cell' : 'hidden lg:table-cell'} 
                    p-4 transition-all duration-200
                    
                    /* Desktop Layout */
                    lg:border-t-1 lg:border-b-1 lg:border-x-0
                    
                    /* Vertical Alignment / Side Caps */
                    lg:first:border-l-1 lg:last:border-r-1
                    
                    /* HOVER STATE: Show full border around the row */
                    group-hover:border-[#ad5389]/40
                    
                    /* EXPANDED vs NORMAL STATE */
                    {expandedIndex === index
					? 'border-y-[#ad5389]/40 border-x-[#ad5389]/40 lg:border-b-transparent'
					: 'border-t-transparent border-x-transparent border-b-slate-100 group-hover:border-b-[#ad5389]/40'}
                    
                    /* Mobile Specific: Rounded corners for the 'card' look */
                    max-lg:border-2 max-lg:rounded-xl
                "
			>
				<div class="flex items-center justify-between gap-4">
					<div class="flex flex-col truncate">
						<span class="truncate text-slate-700 font-semibold lg:font-medium">
							{row[column.key] || '—'}
						</span>
					</div>

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

{#snippet popupEmailEdit(row, onEmailSubmit, closePopup)}
	<div
		class="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40"
	>
		<div
			class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
		>
			<div class="flex items-center justify-between px-8 py-5 border-b border-slate-50 bg-white">
				<div class="flex flex-col">
					<h1 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Edit Email</h1>
				</div>
				<button
					onclick={() => closePopup()}
					class="bg-slate-100 rounded-full p-2.5 text-slate-400 hover:text-slate-900 transition-all cursor-pointer active:scale-90"
				>
					<X size={16} />
				</button>
			</div>

			<div class="p-8 lg:p-10 space-y-5">
				<div class="grid grid-cols-2 gap-4 opacity-60">
					<div class="flex flex-col gap-1">
						<span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Name</span>
						<div
							class="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-sm font-medium"
						>
							{row.name || row.hospitalName || 'N/A'}
						</div>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider"
							>Hospital</span
						>
						<div
							class="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-sm font-medium truncate"
						>
							{row.hospital || 'N/A'}
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-2 pt-2">
					<label
						for="edit-email"
						class="text-[10px] font-bold text-[#ad5389] uppercase tracking-[0.1em]"
					>
						Update Email Address
					</label>
					<input
						id="edit-email"
						type="email"
						value={row.email}
						placeholder="Enter new email"
						class="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl outline-none
                               transition-all focus:border-[#ad5389] text-slate-500 shadow-inner"
					/>
				</div>

				<button
					onclick={() => onEmailSubmit(row)}
					class="group mt-4 flex h-[60px] items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white hover:bg-[#ad5389] transition-all cursor-pointer w-full shadow-lg active:scale-[0.98]"
				>
					<span class="font-bold text-lg"> Save Changes </span>
				</button>
			</div>
		</div>
	</div>
{/snippet}

{#snippet noResults()}
	<div
		class="bg-slate-50 flex items-center justify-center w-full p-6 shadow-inner gap-6 rounded-b-2xl"
	>
		<h1 class="text-slate-400">No results found</h1>
	</div>
{/snippet}
