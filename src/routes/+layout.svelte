<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { validateToken } from '$lib/services/validateToken';
	import '../app.css';
	import { updateNav } from '$lib/state/Navigation.svelte.js';

	let { children } = $props();
	let status = $state('loading');

	$effect(() => {
		const currentPath = page.url.pathname;

		validateToken().then((isValid) => {
			if (!isValid && currentPath !== '/') {
				goto('/', { replaceState: true });
			} else if (isValid && currentPath === '/') {
				goto('/pages/leads/hospital');
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
