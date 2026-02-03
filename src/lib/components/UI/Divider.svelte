<script>
	let { title = 'Section' } = $props();
</script>

<div class="flex items-center w-full mt-[50px] mb-8 select-none">
	<div class="flex-grow border-t border-slate-200"></div>

	<span class="flex-shrink mx-6 text-[18px] font-semibold text-slate-300">
		{title}
	</span>

	<div class="flex-grow border-t border-slate-200"></div>
</div>
