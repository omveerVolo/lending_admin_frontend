<script>
	import { Mail, ArrowRight, LoaderIcon, ArrowLeft } from 'lucide-svelte';
	import CountdownTimer from '$lib/components/CountdownTimer.svelte';
	import OtpInput from '$lib/components/OtpInput.svelte';
	import { goto } from '$app/navigation';
	import { PUBLIC_BASE_URL } from '$env/static/public';

	let step = $state(0);
	let loading = $state(false);
	let error = $state('');
	let email = $state('');
	let otp = $state('');
	let resendCount = $state(0);
	let isResending = $state(false);
	let canResend = $state(false);
	const otp_length = 6;

	// $effect(()=>{
	// 	if(toast.message){

	// 	}
	// })

	const handleVerifyOTP = async () => {
		loading = true;
		if (!emailIntegrity()) {
			loading = false;
			return;
		}
		if (!otpIntegrity()) {
			loading = false;
			return;
		}

		loading = true;
		try {
			const response = await fetch(`${PUBLIC_BASE_URL}/auth/verify`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, otp })
			});

			const data = await response.json();
			console.log(data);
			if (!response.ok) {
				throw new Error(data.message || 'Failed to send OTP');
			}
			loading = false;
			goto('/pages/leads/hospital');
			step = 1;
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	};
	const otpIntegrity = () => {
		if (!otp) {
			error = 'Otp error: please input otp';
			return false;
		}

		if (otp.length !== 6) {
			error = 'Otp error: wrong otp';
			return false;
		}

		for (const ch of otp) {
			if (ch < '0' || ch > '9') {
				error = 'Otp error: invalid otp format';
				return false;
			}
		}

		error = '';
		return true;
	};

	const emailIntegrity = () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!email) {
			error = 'email error: input email';

			return false;
		}

		if (!emailRegex.test(email)) {
			error = 'email error: invalid email format';
			return false;
		}
		return true;
	};
	const handleOtpRequest = async () => {
		loading = true;
		if (!emailIntegrity()) {
			loading = false;
			return;
		}

		error = '';

		try {
			const response = await fetch(`${PUBLIC_BASE_URL}/auth/send`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to send OTP');
			}

			// success
			step = 1;
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	};

	const handleResendOtp = async () => {
		isResending = true;
		resendCount = resendCount + 1;
		otp = '';
		canResend = false;
		if (!emailIntegrity()) {
			loading = false;

			return;
		}

		error = '';

		try {
			const response = await fetch(`${PUBLIC_BASE_URL}/auth/send`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to send OTP');
			}
			step = 1;
		} catch (err) {
			error = err.message;
		} finally {
			isResending = false;
		}
	};
</script>

<div class="bg-white md:bg-slate-50 w-full flex items-center justify-center min-h-screen font-sans">
	<div
		class="flex bg-white p-6 md:p-10 md:rounded-[2.5rem] flex-col w-full h-full min-h-screen md:min-h-0 md:h-auto md:max-w-md md:shadow-[0_20px_50px_rgba(0,0,0,0.04)] md:border md:border-slate-100"
	>
		<div class="flex items-center justify-between w-full mb-12 px-1 pt-4 md:pt-0">
			<div class="flex items-center gap-3">
				<div class="h-10 flex items-center justify-center">
					<img src="/finnova.png" alt="Finnova Health" class="h-full w-auto object-contain" />
				</div>
			</div>
			<span
				class="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md"
			>
				Admin Portal
			</span>
		</div>

		<div class="flex-grow flex flex-col justify-center md:justify-start">
			{#if step === 0}
				<div class="animate-step">
					<div class="flex flex-col items-start mb-4 w-full group">
						<div class="relative w-full">
							<Mail
								class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus:text-gray-600 transition-colors"
								size={20}
							/>
							<input
								autoFocus
								type="email"
								bind:value={email}
								placeholder="Enter your email"
								class="w-full text-md font-normal pl-14 pr-4 py-6 text-slate-500 border-2 border-slate-100 bg-slate-50/50 rounded-3xl outline-none focus:bg-white focus:border-gray-400 transition-all placeholder:text-slate-300"
							/>
						</div>
					</div>
					<div class="mb-10 px-2">
						<p class="text-slate-400 text-xs font-medium">
							We'll send a 6-digit security code to this address to verify your identity.
						</p>
					</div>
				</div>
			{/if}

			{#if step === 1}
				<div class="animate-step">
					<div class="flex flex-col gap-3 items-center mb-4">
						<div class="flex flex-col gap-3 items-center mb-4 relative w-full">
							<button
								onclick={() => (step = 0)}
								class="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all cursor-pointer"
							>
								<ArrowLeft size={18} />
							</button>
							<h1 class="px-5 py-2 bg-gray-100 rounded-2xl text-gray-500 text-[12px]">
								{email}
							</h1>
						</div>
						<div class="flex gap-2">
							{#key `otp-${resendCount}`}
								<OtpInput length={otp_length} onComplete={(val) => (otp = val)} />
							{/key}
						</div>
					</div>
					<div class="mb-10 px-2 text-center md:text-left">
						<p class="text-slate-400 text-xs font-medium">Enter the 6-digit security code</p>
					</div>
				</div>
				<div class="mb-4 px-2 flex gap-2 items-center mx-auto min-h-10">
					{#if isResending}
						<LoaderIcon class="animate-spin" />
					{:else if canResend}
						<button
							onclick={handleResendOtp}
							class="text-blue-600 text-xs font-bold cursor-pointer hover:text-[#ad5389] transition-colors"
						>
							Send OTP again
						</button>
					{:else}
						{#key resendCount}
							<CountdownTimer initialSeconds={10} onExpire={() => (canResend = true)} />
						{/key}
					{/if}
				</div>
			{/if}

			{#if step === 0 && loading}
				<button
					disabled={true}
					class="flex gap-3 bg-slate-900 font-bold items-center justify-center p-5 text-white rounded-3xl active:scale-[0.98] transition-all shadow-xl group cursor-not-allowed"
				>
					<span class="text-lg">Requesting</span>
					<LoaderIcon
						size={20}
						class="group-hover:translate-x-1 transition-transform animate-spin"
					/>
				</button>
			{:else if step === 0}
				{@render showError(error)}
				<button
					onclick={handleOtpRequest}
					class="flex gap-3 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center p-5 text-white rounded-3xl hover:border hover:border-[#ad5389] active:scale-[0.98] cursor-pointer transition-all shadow-xl group"
				>
					<span class="text-lg">Continue with OTP</span>
					<ArrowRight size={20} class="group-hover:translate-x-1 transition-transform" />
				</button>
			{/if}

			{#if step === 1 && loading}
				<button
					disabled={true}
					class="flex gap-3 bg-slate-900 font-bold items-center justify-center p-5 text-white rounded-3xl active:scale-[0.98] transition-all shadow-xl group cursor-not-allowed"
				>
					<span class="text-lg">Validating..</span>
					<LoaderIcon
						size={20}
						class="group-hover:translate-x-1 transition-transform animate-spin"
					/>
				</button>
			{:else if step === 1}
				{@render showError(error)}
				<button
					onclick={handleVerifyOTP}
					class="flex gap-3 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center p-5 text-white rounded-3xl hover:border hover:border-[#ad5389] active:scale-[0.98] cursor-pointer transition-all shadow-xl group"
				>
					<span class="text-lg">Verify OTP</span>
					<ArrowRight size={20} class="group-hover:translate-x-1 transition-transform" />
				</button>
			{/if}
		</div>

		<div class="h-10 md:hidden"></div>
	</div>
</div>

{#snippet showError(value)}
	<div class="min-h-[1.5rem] my-1 flex items-center justify-center">
		{#if value}
			<p class="font-semibold text-red-400 text-[12px] text-center">
				{value}
			</p>
		{/if}
	</div>
{/snippet}
