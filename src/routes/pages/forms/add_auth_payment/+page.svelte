<script>
	import { goto } from '$app/navigation';
	import CommonForm from '$lib/forms/CommonForm.svelte';
	import { toast } from '$lib/state/toastData.svelte';
	import { validate_ifPreAuthEmpty } from '$lib/utils/add_preAuth_validation.svelte';

	import { ArrowLeft, ArrowRight, Loader, MenuIcon } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	let loading = $state(false);
	let errors = $state({});
	let formData = $state({});
	$inspect(errors, formData);
	let items = [
		{
			name: 'full_name',
			label: 'Name',
			type: 'text',
			placeholder: 'Enter Full Name',
			required: true,

			verify_onchange: (value) => {
				if (!value) return 'Please add full name';
				if (value.length < 3) return 'Should have at least 3 letters';
				if (value.length > 50) return 'At most 50 characters allowed';
				return null;
			}
		},
		{
			name: 'email',
			label: 'Email',
			type: 'email',
			placeholder: 'Enter Email',
			required: true,
			verify_onchange: (value) => {
				const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
				if (value && !emailRegex.test(value)) return 'Invalid email address';
				return null;
			}
		},
		{
			name: 'mobile_no',
			label: 'Mobile No.',
			type: 'phone',
			placeholder: 'Enter Mobile Number',
			required: true,
			verify_onchange: (value) => {
				const clean = value.toString().replace(/\D/g, '');
				if (clean.length > 0 && clean.length < 10) return 'Must be 10 digits';
				if (clean.length === 10 && !/^[6-9]\d{9}$/.test(clean)) return 'Invalid Indian number';
				return null;
			}
		},
		{
			name: 'amount',
			label: 'Amount',
			type: 'number',
			placeholder: 'Enter Amount',
			required: true,
			verify_onchange: (value) => {
				if (isNaN(value) || value <= 0) return 'Amount must be greater than 0';
				return null;
			}
		},
		{
			name: 'product_info',
			label: 'Product Info',
			type: 'textarea',
			placeholder: 'Enter product details...',
			required: true,
			verify_onchange: (value) => {
				if (value && value.length > 200) return 'Keep it under 200 characters';
				return null;
			}
		},
		{
			name: 'hospital',
			label: 'Hospital',
			type: 'select_search',
			placeholder: 'Select Hospital',
			required: true,
			options: [
				{ label: 'City General Hospital', value: 'city_general' },
				{ label: "St. Mary's Medical Center", value: 'st_marys' }
			],
			// Selects don't need debounce, they trigger immediately
			verify_onchange: (value) => {
				if (!value || value === 'none') return 'Please select a hospital';
				return null;
			}
		}
	];

	$effect.pre(() => {
		const allItems = [...items];
		allItems.forEach((item) => {
			if (!(item.name in formData)) {
				// Set default values based on type
				formData[item.name] = item.type === 'checkbox' ? false : '';
			}
		});
	});
	function onSubmit() {
		let error = validate_ifPreAuthEmpty(items, formData);
		if (Object.values(error).length > 0) {
			document.getElementById('pre-auth-form')?.scrollIntoView({ y: 0 });
			window.scrollTo(0, 0);
			return (errors = error);
		}

		loading = true;
		setTimeout(() => {
			loading = false;
			toast.update('Testing', 'Testing message', 'sucess');
			goto('/pages/leads/payment');
		}, 3000);
	}
</script>

<div
	id="pre-auth-form"
	class=" grid grid-rows-[auto_1fr] w-full relative mb-16 px-0 lg:px-56 bg-slate-100"
>
	<!-- {@render menu_mobile('/pages/leads/payment')} -->
	<CommonForm {errors} bind:formData {items}>
		{#snippet formTitle()}
			<div class="w-full flex flex-col items-center mb-12">
				<h1 class="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
					Easy Discharge Form
				</h1>
				<!-- <p class="text-slate-400 text-xs mt-1">Volo health</p> -->
			</div>
		{/snippet}
		{#snippet submitButton()}
			{#if loading}
				<button
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
					<span class="font-semibold text-lg leading-none"> Submit </span>
					<ArrowRight
						size={20}
						strokeWidth={2.5}
						class="group-hover:translate-x-1 transition-transform"
					/>
				</button>
			{/if}
		{/snippet}
	</CommonForm>
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
