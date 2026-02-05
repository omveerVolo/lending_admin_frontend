<script>
	export const prerender = true;
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { validateToken } from '$lib/services/validateToken';
	import '../app.css';
	import { updateNav } from '$lib/state/Navigation.svelte.js';
	import { user } from '$lib/state/role_and_permission.svelte';

	let { children } = $props();
	let status = $state('loading');

	$effect(() => {
		const currentPath = page.url.pathname;

		validateToken().then((isValid) => {
			if (!isValid && currentPath !== '/') {
				goto('/', { replaceState: true });
			} else if (isValid && currentPath === '/') {
				user.role == 'relationship_manager'
					? goto('/pages/leads/hospital')
					: goto('/pages/leads/reimbursement_cases');
			} else {
				status = 'ready';
			}
		});
	});

	$effect(() => {
		updateNav(page.url.pathname);
	});
</script>

<!-- <svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head> -->

{#if status === 'loading'}
	<div class="spinner">Checking access...</div>
{:else}
	{@render children()}
{/if}
