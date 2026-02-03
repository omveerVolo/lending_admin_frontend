<script>
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';

	import CommonForm from '$lib/forms/CommonForm.svelte';
	import { ArrowLeft, ArrowRight, Loader, MenuIcon } from 'lucide-svelte';
	import { toast } from '$lib/state/toastData.svelte';
	import { validate_ifAgentFormEmpty } from '$lib/utils/add_agent_validation.svelte';
	import { PUBLIC_BASE_URL } from '$env/static/public';

	let loading = $state(false);
	let errors = $state({});
	async function loadHospitalData() {
		const endpoint = '/api/get_hospitals';

		loading = true;

		try {
			const response = await fetch(`${PUBLIC_BASE_URL}${endpoint}`, {
				method: 'GET',
				credentials: 'include'
			});

			const result = await response.json();

			let incomingData = result.hospitals || result.data || [];
			if (!incomingData.length) {
				return;
			}
			incomingData = incomingData.map(({ _id, name }) => ({ label: name, value: _id }));
			items[2].options = incomingData;
		} catch (error) {
			console.error('Fetch failed:', error);
		} finally {
			loading = false;
		}
	}
	async function onSubmit() {
		let error = validate_ifAgentFormEmpty(items, formData);
		if (Object.values(error).length > 0) {
			document.getElementById('agent_form').scrollIntoView({ y: 0 });
			window.scrollTo(0, 0);
			return (errors = error);
		}
		loading = true;
		try {
			const response = await fetch(`${PUBLIC_BASE_URL}/api/user-agent`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ...formData, role: 'agent' })
			});

			const result = await response.json();
			if (!result.ok) {
				toast.update('Error', 'Failed to add', 'Failed');
			}
			toast.update('Success', 'agent added', 'success');
			setTimeout(() => toast.clear());
			goto('/pages/leads/agent');
		} catch (error) {
			console.error('Failed to fetch agents:', error);
		} finally {
			loading = false;
		}
	}

	let formData = $state({});
	let items = [
		{
			name: 'name',
			label: 'Name',
			type: 'text',
			placeholder: 'Enter First Name',
			required: true,
			verify_onchange: (value, formData) => {
				if (!value) {
					return `please add full name`;
				} else if (value.length < 3) {
					return `should have at least 3 letters`;
				} else if (value.length > 50) {
					return `at most 50 characters allowed`;
				}
			}
		},
		{
			name: 'email',
			label: 'Email',
			type: 'email',
			placeholder: 'Enter Email',
			required: true,
			verify_onchange: (value, formData) => {
				const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
				if (value.length > 0 && !emailRegex.test(value)) {
					return 'Please enter a valid email address';
				}
				return null;
			}
		},
		{
			name: 'hospital',
			label: 'Hospital',
			type: 'select_search',
			placeholder: 'Select Hospital',
			options: [{ label: 'None', value: 'None' }],
			required: true
		},
		{
			name: 'mobileNumber',
			label: 'Mobile No.',
			type: 'phone',
			placeholder: 'Enter Mobile Number',
			required: true,
			verify_onchange: (value, formData) => {
				const cleanValue = value.toString().replace(/\D/g, '');
				const phoneRegex = /^[6-9]\d{9}$/;
				if (cleanValue.length > 0 && cleanValue.length < 10) {
					return 'Mobile number must be 10 digits';
				}
				if (cleanValue.length === 10 && !phoneRegex.test(cleanValue)) {
					return 'Invalid Indian mobile number';
				}
				if (cleanValue.length > 10) {
					return 'Maximum 10 digits allowed';
				}
				return null;
			}
		}
	];

	$effect.pre(() => {
		toast.update('', '', '');
		const allItems = [...items];
		allItems.forEach((item) => {
			if (!(item.name in formData)) {
				formData[item.name] = item.type === 'checkbox' ? false : '';
			}
		});
	});
	console.log(items[2].options);
	$effect.pre(() => {
		loadHospitalData();
	});

	$inspect('addagent data', formData);
</script>

<div
	id="agent_form"
	class=" grid grid-rows-[auto_1fr] w-full relative mb-16 px-0 lg:px-56 bg-slate-100"
>
	<!-- {@render menu_mobile('/pages/leads/agent')} -->
	<CommonForm {errors} bind:formData {items}>
		{#snippet formTitle()}
			<div class="w-full flex flex-col items-center mb-12">
				<h1 class="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
					Agent Information form
				</h1>
				<!-- <p class="text-slate-400 text-xs mt-1">Volo health</p> -->
			</div>
		{/snippet}
		{#snippet submitButton()}
			{#if loading}
				<button
					disabled={true}
					class="group mt-10 mb-10 flex h-[62px] items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white border border-slate-900 transition-all w-full shadow-lg shadow-blue-900/10 cursor-not-allowed"
				>
					<span class="font-semibold text-lg leading-none"> processing </span>
					<Loader size={20} strokeWidth={2.5} class="animate-spin" />
				</button>
			{:else}
				<button
					class="group mt-10 mb-10 flex h-[62px] items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white hover:bg-white hover:text-[#ad5389] border border-transparent hover:border-[#ad5389] transition-all cursor-pointer w-full shadow-lg shadow-blue-900/10"
					onclick={onSubmit}
				>
					<span class="font-semibold text-lg leading-none"> Add Agent </span>
					<ArrowRight
						size={20}
						strokeWidth={2.5}
						class="group-hover:translate-x-1 transition-transform"
					/>
				</button>
			{/if}
		{/snippet}
	</CommonForm>
	<!-- {@render submitButton()} -->
</div>

{#snippet menu_mobile(path)}
	<div
		class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 lg:hidden"
	>
		<button
			onclick={() => goto(path)}
			class="flex items-center gap-3 group active:scale-95 transition-all"
		>
			<div class="p-1 group-hover:bg-slate-100 rounded-full transition-colors">
				<ArrowLeft size={22} class="text-slate-600" />
			</div>
			<span class="text-sm font-medium tracking-wide text-slate-600 uppercase">Home</span>
		</button>

		<button class="p-2 hover:bg-slate-50 rounded-lg transition-colors">
			<MenuIcon size={24} class="text-slate-700" />
		</button>
	</div>
{/snippet}
