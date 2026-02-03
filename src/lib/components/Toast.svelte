<script>
	import { fly } from 'svelte/transition';
	import { CheckSquare, X, XCircle } from 'lucide-svelte';

	import { toast } from '$lib/state/toastData.svelte.js';

	// Map statuses to specific color themes while keeping the clean white design
	const statusThemes = {
		success: {
			title: 'text-slate-900',
			accent: 'bg-emerald-500',
			border: 'border-slate-200',
			icon: CheckSquare
		},
		failed: {
			title: 'text-rose-600',
			accent: 'bg-rose-500',
			border: 'border-rose-100',
			icon: XCircle
		}
	};

	const theme = $derived(statusThemes[toast.status] || statusThemes.success);
</script>

{#key toast.message}
	{#if toast.message}
		<div
			in:fly={{ y: 20, duration: 400 }}
			out:fly={{ y: 20, duration: 300 }}
			class="fixed bottom-10 right-10 z-[100] flex items-center lg:gap-8 gap-3 lg:p-4 p-2 lg:pl-8 pl-4 bg-white rounded-xl border {theme.border} shadow-[0_20px_50px_rgba(0,0,0,0.1)] lg:min-w-[400px] min-w-[300px]"
		>
			{#if toast.status == 'success'}
				<statusThemes.success.icon size={30} />
			{:else}
				<statusThemes.failed.icon size={30} />
			{/if}
			<div class="flex flex-col gap-1">
				<h2 class="text-[1.25rem] tracking-tight {theme.title}">
					{toast.message || 'Notification'}
				</h2>
				<p class="text-slate-400 font-medium leading-tight">
					{toast.message}
				</p>
			</div>

			<div class="relative group ml-auto">
				<div
					class="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#0a0a1a] text-white text-sm font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none mb-2"
				>
					clear
					<div
						class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0a0a1a] rotate-45"
					></div>
				</div>

				<button
					onclick={() => toast.clear()}
					class="p-2 hover:bg-slate-100 cursor-pointer rounded-2xl border border-slate-200 text-slate-900 hover:bg-slate-50 transition-colors flex items-center justify-center group-active:scale-95"
				>
					<X
						onclick={() => {
							toast.clear();
						}}
						size={24}
						strokeWidth={2.5}
					/>
				</button>
			</div>
		</div>
	{/if}
{/key}
