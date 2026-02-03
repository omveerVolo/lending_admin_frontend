<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import FormSteps from '$lib/components/FormSteps.svelte';
	import Checkbox from '$lib/components/UI/Checkbox.svelte';
	import Divider from '$lib/components/UI/Divider.svelte';
	import File from '$lib/components/UI/File.svelte';
	import Input from '$lib/components/UI/Input.svelte';
	import Select from '$lib/components/UI/Select.svelte';
	import { toast } from '$lib/state/toastData.svelte';

	import { ArrowRight, Loader, Plus, Trash2 } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import { fly } from 'svelte/transition';

	let hospital_id = page.params.id;
	let edit = $derived.by(() => (hospital_id ? true : false));
	let formData = $state({});
	let loading = $state(false);
	let step = $state(1);
	let totalSteps = 3;
	let stepCompletion = $state({});
	let errors = $state({});
	let rmlist = $state([]);
	let parentlist = $state([]);
	let providerData = $state({
		lendingMid: '',
		fibePriority: 1,

		payuMid: '',
		PayUPriority: 1,

		razorpayMid: '',
		raorpayPriority: 1,

		emfynMid: '',
		emfynPriority: 1,

		schemes: {
			fibe: [],
			payu: [],
			razorpay: [],
			emfyn: []
		},
		addScheme(type) {
			this.schemes[type].push({
				schemeId: '',
				schemeCode: '',
				subvention: 0,
				pf: 0,
				interestRate: null,
				netIrr: null
			});
		},

		removeScheme(type, index) {
			this.schemes[type].splice(index, 1);
		}
	});

	let step_one = $state([
		{
			key: 'name',
			label: 'Hospital Name',
			type: 'text',
			handleChange: (e) => {
				let value = e.target.value;
				if (!value) {
					errors.name = `please add full name`;
					return;
				} else if (value.length < 3) {
					errors.name = `should have at least 3 letters`;
					return;
				} else if (value.length > 50) {
					errors.name = `at most 50 characters allowed`;
					return;
				}
				errors.name = null;
				formData.name = value;
			},
			disabledIf: () => true,
			required: true
		},
		{
			key: 'address',
			label: 'Address',
			type: 'text',
			handleChange: (e) => {
				let value = e.target.value;
				if (!value || value.trim() === '') {
					errors.address = `Please add a complete address`;
					return;
				} else if (value.length < 10) {
					errors.address = `Address is too short, please provide more detail`;
					return;
				} else if (value.length > 200) {
					errors.address = `Address is too long (max 200 characters)`;
					return;
				}
				delete errors.address;
				formData.address = value;
			},
			disabledIf: () => true,
			required: true
		},
		{
			key: 'pincode',
			label: 'Pincode',
			type: 'text',
			handleChange: async (e) => {
				let val = e.target.value.replace(/\D/g, '');

				if (val.length > 6) {
					val = val.slice(0, 6);
				}
				if (val.length === 6) {
					formData.city = '';
					formData.state = '';
					if (!/^\d{6}$/.test(val)) {
						errors.pincode = 'Only numbers allowed';
						return;
					}

					try {
						const response = await fetch(`https://api.postalpincode.in/pincode/${val}`);
						const data = await response.json();

						if (data[0].Status === 'Success' && data[0].PostOffice) {
							const details = data[0].PostOffice[0];
							formData.city = details.District;
							formData.state = details.State;

							if (errors) {
								delete errors.city;
								delete errors.state;
							}
							delete errors.pincode;
							return;
						} else {
							errors.pincode = 'Invalid Pincode';
							return;
						}
					} catch (err) {
						errors.pincode = 'Verification failed';
						return;
					}
				}

				e.target.value = val;
				formData.pincode = val;

				if (val.length > 0 && val.length < 6) {
					errors.pincode = 'Pincode must be 6 digits';
				} else {
					errors.pincode = null;
				}
			},
			disabledIf: () => true,
			required: true
		},
		{
			key: 'city',
			label: 'City',
			type: 'text',
			disabledIf: () => true,
			handleChange: (e) => (formData.city = e.target.value),
			required: true
		},
		{
			key: 'state',
			label: 'State',
			type: 'text',
			disabledIf: () => true,
			handleChange: (e) => (formData.state = e.target.value),
			required: true
		},
		{
			key: 'parent',
			label: 'Parent Hospital',
			type: 'select',
			get options() {
				return parentlist;
			},
			disabledIf: () => true,
			handleChange: (_value) => {
				errors.parent = null;
				formData.parent = _value;
			},
			required: true
		},
		{
			key: 'rohini_id',
			label: 'Rohini ID',
			type: 'text',
			disabledIf: () => true,
			handleChange: (e) => {
				errors.rohini_id = null;
				let val = e.target.value.replace(/\D/g, '').slice(0, 13);
				e.target.value = val;
				formData.rohini_id = val;

				if (!val) {
					errors.rohini_id = 'Please enter the ID number';
				} else if (val.length < 13) {
					errors.rohini_id = `Must be exactly 13 digits (Current: ${val.length})`;
				} else {
					errors.rohini_id = null;
				}
			},
			required: true
		},
		{
			key: 'rm',
			label: 'Relationship Manager',
			type: 'select',
			get options() {
				return rmlist;
			},
			disabledIf: () => false,
			handleChange: (_value) => {
				if (!_value) {
					errors.rm = 'rm is required';
					formData.rm = _value;
					return;
				}
				errors.rm = null;
				formData.rm = _value;
			},
			required: true
		},
		{
			key: 'reimbursementMid',
			label: 'Reimbursement MID',
			type: 'text',
			placeholder: 'merchant ID',
			disabledIf: () => false,
			handleChange: (e) => {
				delete errors.reimbursementMid;
				let val = e.target.value;
				if (isNaN(val)) {
					const clean = val.replace(/\D/g, '');
					return (e.target.value = clean);
				}
				formData.reimbursementMid = val;
			},
			required: true
		},
		{ type: 'divider', key: 'choose_lender', label: 'Choose lender' },
		{
			key: 'if_Fibe',
			label: 'Onboard with Fibe',
			type: 'checkbox',
			expandable: true,
			disabledIf: () => Boolean(formData.parent),
			handleChange: (_value) => {
				delete errors.if_Fibe;
				delete errors.if_Emfyn;
				delete errors.if_payu;
				delete errors.if_razorpay;
				formData.if_Fibe = _value;
			},
			required: true,
			renderSnippet: fibeFields
		},
		{
			key: 'if_Emfyn',
			label: 'Onboard with EMFYN / ZYPE?',
			type: 'checkbox',
			expandable: true,
			disabledIf: () => Boolean(formData.parent),
			handleChange: (_value) => {
				delete errors.if_Fibe;
				delete errors.if_Emfyn;
				delete errors.if_payu;
				delete errors.if_razorpay;

				formData.if_Emfyn = _value;
			},
			renderSnippet: emfynFields
		},
		{
			key: 'if_payu',
			label: 'Onboard with PayU?',
			type: 'checkbox',
			expandable: true,
			disabledIf: () => Boolean(formData.parent),
			handleChange: (_value) => {
				delete errors.if_Fibe;
				delete errors.if_Emfyn;
				delete errors.if_payu;
				delete errors.if_razorpay;
				formData.if_payu = _value;
			},
			required: true,
			renderSnippet: payuFields
		},
		{
			key: 'if_razorpay',
			label: 'Onboard with razorpay?',
			type: 'checkbox',
			expandable: true,
			disabledIf: () => Boolean(formData.parent),
			handleChange: (_value) => {
				delete errors.if_Fibe;
				delete errors.if_Emfyn;
				delete errors.if_payu;
				delete errors.if_razorpay;
				formData.if_razorpay = _value;
			},
			required: true,
			renderSnippet: razorpayFields
		}
	]);
	let step_two = $state([
		{
			key: 'noOfBeds',
			label: 'Number of beds',
			type: 'select',
			options: [
				{ label: '0-20', value: 'small' },
				{ label: '21-70', value: 'medium' },
				{ label: '70+', value: 'large' }
			],
			placeholder: 'select type',
			handleChange: (_value) => {
				errors.noOfBeds = null;
				formData.noOfBeds = _value;
			},
			disabledIf: () => false
		},
		{
			key: 'annualTurnover',
			label: 'Annual Turnover (in Crores)',
			type: 'number',
			placeholder: 'Annual turnover in Cr',

			handleChange: (e) => {
				errors.annualTurnover = null;
				formData.annualTurnover = e.target.value;
			},
			required: true,
			disabledIf: () => true
		},
		{
			key: 'hospitalCategory',
			label: 'HospitalCategory',
			placeholder: 'hospitalCateogry',
			options: [
				{ label: 'Clinic', value: 'clinic' },
				{ label: 'Nursing Home', value: 'nursing_home' },
				{ label: 'Multi-specialty Hospital', value: 'multi_specialty' },
				{ label: 'Super-specialty Hospital', value: 'super_specialty' }
			],
			type: 'select',
			disabledIf: () => true,
			handleChange: (_value) => {
				errors.hospitalCategory = null;
				formData.hospitalCategory = _value;
			},
			required: true
		}
	]);

	let step_three = $state([
		{
			label: 'Company Registration Certificate',
			key: 'companyRegistrationCertificate',
			type: 'file',
			placeholder: 'drop file here',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.companyRegistrationCertificate = null;
				formData.companyRegistrationCertificate = _value;
			}
		},
		{
			label: 'Hospital Registration Certificate',
			key: 'hospitalRegistrationCertificate',
			type: 'file',
			required: true,
			placeholder: 'drop file here',
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.hospitalRegistrationCertificate = null;
				formData.hospitalRegistrationCertificate = _value;
			}
		},
		{
			label: 'Hospital PAN',
			key: 'hospitalPan',
			type: 'file',
			required: true,
			placeholder: 'drop file here',
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.hospitalPan = null;
				formData.hospitalPan = _value;
			}
		},
		{
			label: 'Cancelled Cheque',
			key: 'cancelledCheque',
			type: 'file',
			placeholder: 'drop file here',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.cancelledCheque = null;
				formData.cancelledCheque = _value;
			}
		},
		{
			label: 'Aadhaar Card of Authorized Signatory',
			key: 'aadharCard',
			type: 'file',
			placeholder: 'drop file here',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.aadharCard = null;
				formData.aadharCard = _value;
			}
		},
		{
			label: 'PAN Card of Authorized Signatory',
			key: 'panCard',
			type: 'file',
			placeholder: 'drop file here',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.panCard = null;
				formData.panCard = _value;
			}
		},
		{
			label: 'MSA Agreement',
			key: 'msaAgreement',
			type: 'file',
			placeholder: 'drop file here',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.msaAgreement = null;
				formData.msaAgreement = _value;
			}
		},
		{
			label: 'TOA',
			key: 'toa',
			type: 'file',
			placeholder: 'drop file here',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.toa = null;
				formData.toa = _value;
			}
		},
		{
			label: 'Rohini Certificate',
			key: 'rohiniCertificate',
			type: 'file',
			placeholder: 'drop file here',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.rohiniCertificate = null;
				formData.rohiniCertificate = _value;
			}
		},
		{
			label: 'Udhyam Aadhaar / MSME',
			key: 'udhyamAadhaar',
			type: 'file',
			placeholder: 'drop file here',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.udhyamAadhaar = null;
				formData.udhyamAadhaar = _value;
			}
		},
		{
			label: 'Partnership / LLP Deed',
			key: 'partnershipDeed',
			type: 'file',
			placeholder: 'drop file here',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.partnershipDeed = null;
				formData.partnershipDeed = _value;
			}
		},
		{
			label: 'HUF / Trust Deed',
			key: 'trustDeed',
			placeholder: 'drop file here',
			type: 'file',
			required: true,
			disabledIf: () => false,
			handleChange: (_value) => {
				errors.trustDeed = null;
				formData.trustDeed = _value;
			}
		}
	]);

	async function onSubmit() {
		errors = {};
		const validationResult = validateform();

		if (Object.keys(validationResult).length > 0) {
			errors = validationResult;
			document.getElementById('hospital_edit_form').scrollIntoView({ behavior: 'smooth' });
			window.scrollTo(0, 0);
			return;
		}

		const isLastStep = step === totalSteps;

		if (!isLastStep) {
			stepCompletion = { ...stepCompletion, [step]: true };
			step += 1;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			loading = true;

			try {
				const submissionData = new FormData();
				//step one and two append
				submissionData.append('name', formData.name);
				submissionData.append('address', formData.address);
				submissionData.append('pincode', formData.pincode);
				submissionData.append('city', formData.city);
				submissionData.append('state', formData.state);
				submissionData.append('parent', formData.parent || '');
				submissionData.append('rohiniId', formData.rohini_id);
				submissionData.append('rm', formData.rm);
				submissionData.append('numberOfBeds', formData.noOfBeds);
				submissionData.append('annualTurnover', formData.annualTurnover);
				submissionData.append('hospitalCategory', formData.hospitalCategory);
				submissionData.append('reimbursementMid', formData.reimbursementMid);

				if (formData.if_Fibe) {
					submissionData.append('lendingMid', providerData.lendingMid);
					submissionData.append('fibePriority', providerData.fibePriority);
				}
				if (formData.if_payu) {
					submissionData.append('payuMid', providerData.payuMid);
				}
				if (formData.if_razorpay) {
					submissionData.append('razorpayMid', providerData.razorpayMid);
				}
				if (formData.if_Emfyn) {
					submissionData.append('emfynMid', providerData.emfynMid);
					submissionData.append('emfynPriority', providerData.emfynPriority);
				}

				submissionData.append('schemes', JSON.stringify(providerData.schemes));
				//end

				step_three.forEach((field) => {
					const value = formData[field.key];
					if (value instanceof Blob) {
						submissionData.append(field.key, value);
					}
				});

				const query = new URLSearchParams({
					edit: String(edit),
					hospitalId: hospital_id || '',
					mid_enabled: 'true'
				});

				const response = await fetch(`${PUBLIC_BASE_URL}/api/hospital?${query.toString()}`, {
					method: 'POST',
					body: submissionData,
					credentials: 'include'
				});

				const result = await response.json();
				if (response.ok) {
					toast.update('Success', 'Hospital updated', 'success');
					setTimeout(() => {
						toast.clear();
					}, 5000);
					goto('/pages/leads/hospital');
				} else {
					toast.update('Error', result.message, 'failed');
				}
			} catch (err) {
				toast.update('Error', err, 'failed');
			} finally {
				loading = false;
			}
		}
	}

	function validateform() {
		let validation_errors = {};
		let currentFields = [];

		if (step === 1) currentFields = step_one;
		else if (step === 2) currentFields = step_two;
		else if (step === 3) currentFields = step_three;

		const lenderKeys = ['if_Fibe', 'if_razorpay', 'if_payu', 'if_Emfyn'];
		const anyLenderSelected = lenderKeys.some((key) => formData[key] === true);

		// 1. Standard Field Validation
		currentFields.forEach((item) => {
			if (item.type === 'divider') return;
			const isLenderCheckbox = lenderKeys.includes(item.key);
			if (isLenderCheckbox || item.key === 'parent' || item.key === 'reimbursementMid') return;

			if (!formData[item.key] || formData[item.key] === '') {
				validation_errors[item.key] = `${item.label} is required`;
			}
		});

		// 2. Custom Logic for Step 1
		if (step === 1) {
			// --- Parent vs Lender Check ---
			if (edit) {
				if (!anyLenderSelected) {
					lenderKeys.forEach((key) => (validation_errors[key] = 'Select at least one lender.'));
				}
			} else {
				const hasParent = formData.parent && formData.parent !== '';
				if (!hasParent && !anyLenderSelected) {
					validation_errors.parent = 'Select parent or choose a lender';
					lenderKeys.forEach((key) => (validation_errors[key] = 'Required if no parent'));
				}
			}

			// --- MID & Priority Validation (The part you requested) ---
			// Mapping the checkbox key to the providerData keys
			const providerMapping = {
				if_Fibe: { mid: 'lendingMid', priority: 'fibePriority', label: 'Fibe' },
				if_payu: { mid: 'payuMid', priority: 'PayUPriority', label: 'PayU' },
				if_razorpay: { mid: 'razorpayMid', priority: 'raorpayPriority', label: 'Razorpay' },
				if_Emfyn: { mid: 'emfynMid', priority: 'emfynPriority', label: 'Emfyn' }
			};

			lenderKeys.forEach((key) => {
				if (formData[key]) {
					const config = providerMapping[key];
					const midValue = providerData[config.mid];
					const priorityValue = providerData[config.priority];

					if (!midValue || midValue.toString().trim() === '') {
						validation_errors[key] = `${config.label} MID is required`;
					}
					if (priorityValue === null || priorityValue === undefined || priorityValue === '') {
						validation_errors[key] = `${config.label} Priority is required`;
					}
				}
			});
		}

		return validation_errors;
	}

	$effect(() => {
		let inital_stateCompletion = {};
		if (edit) {
			Array(totalSteps)
				.fill('')
				.forEach((_, index) => (inital_stateCompletion[index + 1] = true));
		}
		untrack(() => (stepCompletion = inital_stateCompletion));
	});

	function populationHelper(item) {
		if (item.type == 'checkbox') {
			return (formData[item.key] = false);
		} else if (item.type == 'file') {
			return (formData[item.key] = null);
		} else {
			return (formData[item.key] = '');
		}
	}
	async function loadAllParentHospitals() {
		const endpoint = '/api/get_hospitals';

		try {
			const response = await fetch(`${PUBLIC_BASE_URL}${endpoint}`, {
				method: 'GET',
				credentials: 'include'
			});

			const result = await response.json();
			const incomingData = result.hospitals || result.data || [];
			parentlist = incomingData
				.filter((h) => h.parent == null)
				.map(({ _id, name }) => ({ label: name, value: _id }));

			const parentField = step_one.find((item) => item?.key === 'parent');
			if (parentField) parentField.options = parentlist;
		} catch (error) {
			console.error('Fetch failed:', error);
		} finally {
		}
	}
	async function loadAllrms() {
		const endpoint = '/api/get_rm';

		try {
			const response = await fetch(`${PUBLIC_BASE_URL}${endpoint}`, {
				method: 'GET',
				credentials: 'include'
			});

			const result = await response.json();

			let incomingData = result.rMs || [];
			rmlist = incomingData.map(({ _id, name }) => ({ label: name, value: _id }));

			const rmField = step_one.find((item) => item?.key === 'rm');
			if (rmField) rmField.options = rmlist;
		} catch (error) {
			console.error('Fetch failed:', error);
		} finally {
		}
	}

	$effect(() => {
		if (edit === true) {
			const loadData = async () => {
				try {
					const res = await fetch(`${PUBLIC_BASE_URL}/api/hospitals/${hospital_id}`, {
						credentials: 'include'
					});
					const { hospital } = await res.json();

					formData = { ...formData, rm: hospital.relationshipManager._id, ...hospital };
					mapLenderDataToState(formData?.lenderMIDs);
				} catch (err) {
					console.error('Failed to fetch hospital:', err);
				}
			};

			loadData();
		} else {
			[...step_one, ...step_two, ...step_three].forEach(populationHelper);
		}
	});
	function mapLenderDataToState(lenderMIDs) {
		if (!lenderMIDs || !Array.isArray(lenderMIDs)) return;

		lenderMIDs.forEach((item) => {
			const lenderName = item.lender?.name?.toLowerCase();
			const service = item.serviceType;

			if (lenderName === 'fibe') {
				formData.if_Fibe = true;
				if (service === 'lending') {
					providerData.lendingMid = item.mid;
					providerData.fibePriority = item.priority || 1;
					providerData.schemes.fibe = [...item.schemes];
				} else if (service === 'reimbursement') {
					formData.reimbursementMid = item.mid;
				}
			} else if (lenderName === 'payu') {
				formData.if_payu = true;
				providerData.payuMid = item.mid;
				providerData.PayUPriority = item.priority || 1;
				providerData.schemes.payu = [...item.schemes];
			} else if (lenderName === 'razorpay') {
				formData.if_razorpay = true;
				providerData.razorpayMid = item.mid;
				providerData.raorpayPriority = item.priority || 1;
				providerData.schemes.razorpay = [...item.schemes];
			} else if (lenderName === 'emfyn') {
				formData.if_Emfyn = true;
				providerData.emfynMid = item.mid;
				providerData.emfynPriority = item.priority || 1;
				providerData.schemes.emfyn = [...item.schemes];
			}
		});
	}
	$effect(() => {
		if (!formData.if_Fibe) {
			providerData.lendingMid = '';
			providerData.fibePriority = 1;
			providerData.schemes.fibe = [];

			formData.reimbursementMid = '';
		}

		if (!formData.if_payu) {
			providerData.payuMid = '';
			providerData.PayUPriority = 1;
			providerData.schemes.payu = [];
		}

		if (!formData.if_razorpay) {
			providerData.razorpayMid = '';
			providerData.raorpayPriority = 1;
			providerData.schemes.razorpay = [];
		}

		if (!formData.if_Emfyn) {
			providerData.emfynMid = '';
			providerData.emfynPriority = 1;
			providerData.schemes.emfyn = [];
		}
	});
	$effect.pre(() => {
		loadAllParentHospitals();
		loadAllrms();
	});
	// $effect(() => {});
	// $inspect(providerData);
	// $inspect(formData);
</script>

<div
	id="hospital_edit_form"
	class=" grid grid-rows-[auto_1fr] w-full relative mb-16 px-0 lg:px-30 bg-gray-100"
>
	<FormSteps bind:step {stepCompletion} steps={Array(totalSteps).fill('')} />
	<div
		class="w-full min-h-screen bg-gray-100 flex justify-center items-start py-10 px-6 overflow-y-auto touch-pan-y"
	>
		<!-- wrapper only -->
		<div class=" w-full max-w-md lg:max-w-full flex flex-col lg:items-stretch">
			<!-- title -->
			{@render formTitle()}
			{#if step == 1}
				{@render renderStep(step_one)}
			{:else if step == 2}
				{@render renderStep(step_two)}
			{:else if step == 3}
				{@render renderStep(step_three)}
			{/if}
		</div>
	</div>
</div>

<!-- snipperts layer -->
{#snippet formTitle()}
	<div class="w-full flex flex-col items-center lg:mb-10 mb-10">
		<h1 class="text-md font-medium uppercase tracking-[0.2em] text-slate-500 text-center">
			Edit Hospital form
		</h1>
	</div>
{/snippet}

{#snippet renderStep(configs)}
	<div class="flex flex-col gap-y-4">
		{#each configs as config (config?.key)}
			<div class="flex flex-col gap-2 w-full">
				{#if config?.type !== 'checkbox' && config?.type !== 'divider'}
					{@render fieldLabel(config?.label)}
				{/if}

				{#if config?.type === 'text' || config?.type === 'number' || config?.type === 'email'}
					<Input
						disabledIf={config.disabledIf}
						placeholder={config.placeholder}
						type={config.type}
						value={formData[config.key]}
						error={errors[config.key]}
						onUpdate={(newValue) => config.handleChange(newValue)}
					/>
				{:else if config?.type === 'select'}
					<Select
						options={config.options}
						disabledIf={config.disabledIf}
						placeholder={config.placeholder}
						type={config.type}
						value={formData[config.key]}
						error={errors[config.key]}
						onUpdate={(newValue) => config.handleChange(newValue)}
					/>
				{:else if config?.type === 'checkbox'}
					<Checkbox
						label={config.label}
						value={formData[config.key]}
						disabledIf={config.disabledIf}
						expandable={config.expandable}
						onUpdate={(v) => config.handleChange(v)}
						error={errors[config.key]}
					>
						{#if config.renderSnippet}
							{@render config.renderSnippet()}
						{/if}
					</Checkbox>
				{:else if config?.type === 'divider'}
					<Divider title={config?.label} />
				{:else if config?.type === 'file'}
					<File
						label={config.label}
						name={config.key}
						value={formData[config.key]}
						error={errors[config.key]}
						disabledIf={config.disabledIf}
						onUpdate={(file) => config.handleChange(file)}
					/>
				{/if}
			</div>
		{/each}
		{@render submitButton()}
	</div>
{/snippet}

{#snippet fieldLabel(value)}
	<label class="text-slate-400 font-medium text-sm">{value}</label>
{/snippet}

{#snippet errorSnippet(error)}
	<div class="h-4 overflow-hidden">
		{#if error}
			<span
				transition:fly={{ y: -5, duration: 200 }}
				class="text-rose-500 text-xs font-normal ml-2 block"
			>
				{error}
			</span>
		{/if}
	</div>
{/snippet}

{#snippet submitButton()}
	{#if loading}
		<button
			class="group mt-10 mb-10 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white hover:bg-white hover:text-[#ad5389] border hover:border-[#ad5389] transition-all w-full shadow-lg shadow-blue-900/10 cursor-not-allowed"
		>
			<span class="font-semibold text-lg"> processing </span>
			<Loader size={20} strokeWidth={2.5} class="animate-spin" />
		</button>
	{:else}
		<button
			class="group mt-10 mb-10 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white hover:bg-white hover:text-[#ad5389] border hover:border-[#ad5389] transition-all cursor-pointer w-full shadow-lg shadow-blue-900/10"
			onclick={onSubmit}
		>
			<span class="font-semibold text-lg">
				{step < totalSteps ? 'Next Step' : 'Submit Registration'}
			</span>

			{#if step < totalSteps - 1}
				<ArrowRight
					size={20}
					strokeWidth={2.5}
					class="group-hover:translate-x-1 transition-transform"
				/>
			{:else}
				<Plus size={20} strokeWidth={2.5} />
			{/if}
		</button>
	{/if}
{/snippet}

{#snippet lenderTemplate(midKey, priorityKey, schemesArray, type)}
	<div class="flex flex-col gap-6">
		<div class="grid grid-cols-2 gap-4">
			<div class="flex flex-col gap-2">
				<label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
					Merchant ID
				</label>
				<input
					bind:value={providerData[midKey]}
					placeholder="Enter MID"
					class="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-[#ad5389] transition-all"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
					Priority
				</label>

				<div class="relative flex items-center">
					<input
						type="number"
						bind:value={providerData[priorityKey]}
						placeholder="1"
						class="no-spinner w-full bg-white border border-slate-200 rounded-xl p-3 pr-16 text-sm outline-none focus:border-[#ad5389] transition-all"
					/>

					{#if providerData[priorityKey] == 1}
						<div class="absolute right-3 pointer-events-none select-none">
							<span
								class="text-[8px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-black uppercase tracking-tighter border border-green-200 shadow-sm"
							>
								Highest
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<style>
			.no-spinner::-webkit-inner-spin-button,
			.no-spinner::-webkit-outer-spin-button {
				-webkit-appearance: none;
				margin: 0;
			}

			.no-spinner {
				-moz-appearance: textfield;
				appearance: textfield;
			}
		</style>

		<div class="flex items-center justify-between border-b border-slate-100 pb-3 mt-2">
			<h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-500">
				Schemes ({schemesArray.length})
			</h3>

			<button
				type="button"
				onclick={() => providerData.addScheme(type)}
				class="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest
                       hover:bg-[#ad5389] hover:shadow-lg hover:shadow-[#ad5389]/20
                       active:scale-95 transition-all cursor-pointer flex items-center gap-2"
			>
				<span>+ Add Scheme</span>
			</button>
		</div>

		<div class="flex flex-col gap-4">
			{#each schemesArray as scheme, i (i)}
				{@render single_scheme_card(scheme, i, type)}
			{:else}
				<div class="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
					<p class="text-xs text-slate-400 italic">No schemes configured for this lender.</p>
				</div>
			{/each}
		</div>
	</div>
{/snippet}
{#snippet single_scheme_card(scheme, index, type)}
	<div
		class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative group"
	>
		<button
			type="button"
			onclick={() => providerData.removeScheme(type, index)}
			class="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
		>
			<Trash2 size={14} />
		</button>

		<span class="text-[9px] font-black text-slate-300 uppercase mb-3 block">Scheme {index + 1}</span
		>

		<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
			{#each [{ l: 'ID', k: 'schemeId', p: 'ID' }, { l: 'Code', k: 'schemeCode', p: '3/0' }, { l: 'Subvention', k: 'subvention', p: '0.00' }, { l: 'PF', k: 'pf', p: '0.00' }, { l: 'Interest', k: 'interestRate', p: '%' }, { l: 'Net IRR', k: 'netIrr', p: '%' }] as field}
				<div class="flex flex-col gap-1">
					<label class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter"
						>{field.l}</label
					>
					<input
						bind:value={scheme[field.k]}
						placeholder={field.p}
						class="bg-slate-50 border-none rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#ad5389] outline-none"
					/>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet fibeFields()}
	{@render lenderTemplate('lendingMid', 'fibePriority', providerData.schemes.fibe, 'fibe')}
{/snippet}

{#snippet payuFields()}
	{@render lenderTemplate('payuMid', 'PayUPriority', providerData.schemes.payu, 'payu')}
{/snippet}
{#snippet razorpayFields()}
	{@render lenderTemplate(
		'razorpayMid',
		'razorpayPriority',
		providerData.schemes.razorpay,
		'razorpay'
	)}
{/snippet}

{#snippet emfynFields()}
	{@render lenderTemplate('emfynMid', 'emfynPriority', providerData.schemes.emfyn, 'emfyn')}
{/snippet}
<!-- end of snippet layer -->
