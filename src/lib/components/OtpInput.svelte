<script>
	let { length = 6, onComplete } = $props();
	let otp = $state(new Array(length).fill(''));
	let inputs = $state([]);

	$effect(() => {
		if (inputs[0]) {
			inputs[0].focus();
		}
	});

	function handleInput(e, i) {
		const val = e.target.value;
		if (!/^\d*$/.test(val)) return;
		otp[i] = val.slice(-1);

		if (val && i < length - 1) {
			inputs[i + 1].focus();
		}

		if (otp.join('').length === length) {
			onComplete?.(otp.join(''));
		}
	}

	function handleKeyDown(e, i) {
		if (e.key === 'Backspace') {
			if (!otp[i] && i > 0) {
				otp[i - 1] = '';
				inputs[i - 1].focus();
			} else {
				otp[i] = '';
			}
		}
	}

	function onpaste(e) {
		e.preventDefault();
		const data = e.clipboardData.getData('text').slice(0, length).split('');
		data.forEach((char, index) => {
			if (index < length) otp[index] = char;
		});

		const nextIndex = Math.min(data.length, length - 1);
		inputs[nextIndex].focus();
	}
</script>

<div class="flex gap-2 justify-between w-full" {onpaste}>
	{#each otp as _, i (i)}
		<input
			bind:this={inputs[i]}
			inputmode="numeric"
			oninput={(e) => handleInput(e, i)}
			onkeydown={(e) => handleKeyDown(e, i)}
			type="text"
			bind:value={otp[i]}
			maxLength={1}
			class="w-full h-14 text-center text-xl font-semibold text-slate-800 border-2 border-slate-400 bg-slate-50/50 rounded-2xl outline-none focus:bg-white focus:border-[#ad5389] transition-all"
		/>
	{/each}
</div>
