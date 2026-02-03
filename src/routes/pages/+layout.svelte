<script>
	import Navigation from '$lib/components/Navigation.svelte';
	import { toast } from '$lib/state/toastData.svelte.js';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();
</script>

<div class="flex flex-col lg:flex-row gap-0 lg:gap-5">
	{#if toast.message}
		<Toast />
	{/if}
	<Navigation />
	<div class="max-h-dvh overflow-y-scroll w-full">
		{@render children()}
	</div>
</div>
