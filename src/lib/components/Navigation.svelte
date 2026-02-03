<script>
	import {
		Hospital,
		Headphones,
		BanknoteArrowDown,
		LogOut,
		Menu,
		X,
		ChevronLeft
	} from 'lucide-svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fly, fade } from 'svelte/transition';
	import { navState } from '$lib/state/Navigation.svelte';
	import { PUBLIC_BASE_URL } from '$env/static/public';
	let active_route = $derived(page.url.pathname);
	let homeroute = $derived(
		['/pages/leads/hospital', '/pages/leads/agent', '/pages/leads/payment', '/', ''].includes(
			page.url.pathname
		)
	);
	let isMenuOpen = $state(false);

	const handleLogout = async () => {
		try {
			const response = await fetch(`${PUBLIC_BASE_URL}/auth/out`, {
				method: 'GET',
				credentials: 'include'
			});

			const data = await response.json();
			// if (data.token) {
			// 	localStorage.setItem('admin_jwt', JSON.stringify(data.token));
			// }

			if (!response.ok) {
				throw new Error(data.message || 'Failed to send OTP');
			}

			goto('/');
		} catch (err) {
		} finally {
			isMenuOpen = false;
		}
	};
	// $inspect(active_route);

	const routes = [
		{
			category: 'main',
			options: [
				{
					label: 'Hospital',
					route: '/pages/leads/hospital',
					icon: Hospital,
					handler: () => goto('/pages/leads/hospital')
				},
				{
					label: 'Agent',
					route: '/pages/leads/agent',
					icon: Headphones,
					handler: () => goto('/pages/leads/agent')
				},
				{
					label: 'Pre Auth',
					route: '/pages/leads/payment',
					icon: BanknoteArrowDown,
					handler: () => goto('/pages/leads/payment')
				}
			]
		},
		{
			category: 'account',
			options: [
				{
					label: 'Logout',
					route: '/Logout',
					icon: LogOut,
					handler: handleLogout
				}
			]
		}
	];

	const navigate = (handler) => {
		isMenuOpen = false;
		handler();
	};

	function handleBack() {
		if (navState.prevPath) {
			goto(navState.prevPath);
		} else {
			// Your "Safety Net" fallback
			goto('/pages/leads/hospital');
		}
	}
</script>

<div
	class="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-30 w-full shadow-sm"
>
	{#if homeroute}
		<div class="flex items-center gap-3">
			<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
				<span class="text-white font-bold text-lg">M</span>
			</div>
			<span class="font-bold tracking-tight">Finnova</span>
		</div>
	{:else}
		<div class="flex items-center gap-3">
			<button
				onclick={handleBack}
				class="flex items-center gap-1 text-slate-800 hover:text-[#ad5389]"
			>
				<ChevronLeft size={24} />
				<span class="font-bold text-sm">Home</span>
			</button>
		</div>
	{/if}

	<button
		onclick={() => (isMenuOpen = !isMenuOpen)}
		class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
	>
		<Menu size={24} />
	</button>
</div>

{#if isMenuOpen}
	<div
		role="presentation"
		transition:fade={{ duration: 200 }}
		onclick={() => (isMenuOpen = false)}
		class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-10 lg:hidden bg-red-400"
	></div>

	<div
		transition:fly={{ x: -300, duration: 300, opacity: 1 }}
		class="fixed inset-y-0 left-0 w-72 bg-white z-50 p-6 shadow-2xl lg:hidden flex flex-col"
	>
		<div class="flex items-center justify-between mb-12 px-2">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
					<span class="text-white font-bold text-xl">M</span>
				</div>
				<span class="text-xl font-bold tracking-tight">Finnova</span>
			</div>
			<button onclick={() => (isMenuOpen = false)} class="text-gray-400 p-1">
				<X size={24} />
			</button>
		</div>

		{@render navContent()}
	</div>
{/if}

<div
	class="h-screen w-64 bg-white border-r border-gray-100 lg:flex lg:flex-col p-6 hidden sticky top-0"
>
	<div class="flex items-center gap-3 mb-12 px-2">
		<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
			<span class="text-white font-bold text-xl">M</span>
		</div>
		<span class="text-xl font-bold tracking-tight">Finnova</span>
	</div>

	{@render navContent()}
</div>

{#snippet navContent()}
	<nav class="flex-1 flex flex-col gap-8">
		{#each routes as group}
			<div class="flex flex-col gap-3">
				<h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
					{group.category}
				</h3>

				<div class="flex flex-col gap-1">
					{#each group.options as item}
						<button
							onclick={() => navigate(item.handler)}
							class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group w-full text-left
                            {active_route === item.route
								? 'bg-[#ad5389]/10 text-[#ad5389]'
								: 'text-gray-600 hover:bg-[#ad5389]/5 hover:text-[#ad5389]'}"
						>
							<span class="transition-transform group-hover:scale-110">
								<item.icon size={22} />
							</span>
							<span class="font-medium">{item.label}</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</nav>
{/snippet}
