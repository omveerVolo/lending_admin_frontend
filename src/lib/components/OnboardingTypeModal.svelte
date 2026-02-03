<script>
	import { goto } from '$app/navigation';
	import { CheckCircle2, CreditCardIcon, HospitalIcon, X } from 'lucide-svelte';
	let { isOpenModal } = $props();
</script>

<div
	class="fixed inset-0 bg-slate-900/40 z-30 flex lg:flex-row flex-col items-center lg:items-start justify-center p-4"
>
	<div
		class="lg:grid lg:grid-cols-2 flex flex-col p-10 relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl gap-8 border border-slate-100 animate-in fade-in zoom-in duration-200 mb-20 mt-20 lg:mt-10"
	>
		<X
			size={20}
			class="absolute z-50 bg-slate-200 px-2 py-2 rounded-full right-8 top-8 text-slate-400 cursor-pointer hover:bg-slate-100 hover:text-slate-900 rounded-full p-1 w-8 h-8 transition-all"
			onclick={isOpenModal}
		/>

		<div class="col-span-2 text-center mb-2 mt-10">
			<h1 class="text-2xl font-bold text-slate-800 select-none">Select Onboarding Type</h1>
			<p class="text-slate-500 text-sm mt-1 select-none">
				Choose the configuration that fits the hospital's current needs
			</p>
		</div>

		<div
			onclick={() => goto('/pages/forms/hospital_onboard?mid_enabled=true')}
			class="select-none active:border-[#ad5389] group flex flex-col items-center p-2 lg:p-6 border-2 border-slate-200 hover:border-[#ad5389]/20 bg-slate-50/50 hover:bg-white hover:shadow-xl cursor-pointer rounded-[2rem] transition-all flex-1"
		>
			<div
				class="rounded-2xl bg-white shadow-sm p-4 mb-6 group-hover:scale-110 group-hover:text-[#ad5389] transition-transform duration-300"
			>
				<CreditCardIcon size={40} />
			</div>

			<h2 class="font-bold text-lg text-slate-800 mb-1">With MID</h2>
			<p class="text-center text-xs text-slate-500 leading-relaxed mb-6 px-2">
				Complete hospital setup with Merchant ID for seamless payment processing.
			</p>

			<div class="flex flex-col gap-3 lg:gap-5 w-full mb-8 lg:block hidden">
				{#each ['Payment processing enabled', 'Multiple payment gateways', 'Real-time tracking'] as text}
					<div class="flex items-center gap-3 text-slate-600">
						<CheckCircle2 size={16} class="text-green-500" />
						<span class="text-xs font-medium">{text}</span>
					</div>
				{/each}
			</div>
		</div>

		<div
			onclick={() => goto('/pages/forms/hospital_onboard?mid_enabled=false')}
			class="active:border-[#ad5389] group flex flex-col items-center p-2 lg:p-6 border-2 border-slate-200 hover:border-[#ad5389]/20 bg-slate-50/50 hover:bg-white hover:shadow-xl cursor-pointer rounded-[2rem] transition-all flex-1"
		>
			<div
				class="rounded-2xl bg-white shadow-sm p-4 mb-6 group-hover:scale-110 group-hover:text-[#ad5389] transition-transform duration-300"
			>
				<HospitalIcon size={40} />
			</div>

			<h2 class="font-bold text-lg text-slate-800 mb-1">Without MID</h2>
			<p class="text-center text-xs text-slate-500 leading-relaxed mb-6 px-2">
				Basic hospital setup without payment processing. Ideal for initial registration.
			</p>

			<div class="flex flex-col gap-3 lg:gap-5 w-full mb-8 lg:block hidden">
				{#each ['Basic profile setup', 'Information collection', 'MID can be added later'] as text, i}
					<div class="flex items-center gap-3 text-slate-600">
						<CheckCircle2 size={16} class="text-blue-500" />
						<span class="text-xs font-medium">{text}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
