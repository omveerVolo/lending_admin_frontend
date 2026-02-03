<script>
	let { initialSeconds = 10, onExpire } = $props();
	let seconds = $state(initialSeconds);

	$effect(() => {
		const timer = setInterval(() => {
			if (seconds > 0) {
				seconds -= 1;
			} else {
				onExpire?.();
				clearInterval(timer);
			}
		}, 1000);

		return () => {
			clearInterval(timer);
		};
	});

	let formattedTime = $derived(`00:${seconds.toString().padStart(2, '0')}`);
</script>

<span
	class="text-xs font-bold text-[#ad5389] bg-pink-50 px-3 py-1 rounded-full border border-pink-100"
>
	Resend in {formattedTime}
</span>
