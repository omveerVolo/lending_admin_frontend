<script>
	import { goto } from '$app/navigation';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import Select from '$lib/components/UI/Select.svelte';
	import { toast } from '$lib/state/toastData.svelte';
	import { user } from '$lib/state/role_and_permission.svelte';

	import {
		CheckCircle,
		ChevronRight,
		ChevronDown,
		Copy,
		Edit,
		ExternalLink,
		FolderClosed,
		Link,
		Loader,
		LogIn,
		LogInIcon,
		Plus,
		Search,
		Upload,
		X,
		XCircle
	} from 'lucide-svelte';

	let page = $state(1);
	let card = true;
	let rows = $state([]);
	let currentPage = $state(1);
	let baseEndpoint = $derived(
		user.role?.toLowerCase()?.trim() === 'doctor'
			? '/api/reimbursement/doctor'
			: '/api/reimbursement/lender'
	);
	let value = $state('');
	let loading = $state(false);
	let popupData = $state(null);
	let totalPages = $state(1);
	let expandedIndex = $state(null);
	let closure_resaon = $state('');
	let closure_description = $state('');
	let buttonActive = $state(false);
	let rejection_order = $state(null);
	let rejection_reason = $state('');
	let inputsData = $state({});
	let fetchingFile = $state(null);
	let selected_order_for_files = $state(null);
	let statusEditOrder = $state(null);
	let newStatus = $state('');
	let isStatusDropdownOpen = $state(false);
	let additionalFiles = $state([]);
	let rmUploadOrder = $state(null);
	let rmUploadFormData = $state({
		cancelledCheque: null,
		finalBill: null
	});
	let billVerifyOrder = $state(null);

	let billDocs = $derived.by(() => {
		const docs = billVerifyOrder?.documents || {};
		// Only show the finalBill document — either from nested doctorDoc bucket or flat top-level
		const finalBillUrl = docs?.doctorDoc?.finalBill || docs?.finalBill || null;
		if (!finalBillUrl) return [];
		return [{ name: 'Final Bill', url: finalBillUrl }];
	});
	let statusFormData = $state({
		loanAmount: '',
		prefBankAccount: '',
		prefIfsc: '',
		podNumber: '',
		utrNumber: '',
		partialDisbursedAmount: '',
		finalUtrNumber: '',
		finalDisbursalAmount: ''
	});

	let status_options = $derived.by(() => {
		const role = user.role?.toLowerCase()?.trim();
		let options = [];
		let disabledOptions = new Set();
		if (role === 'doctor') {
			// options = ['rejected', 'additional_documents_required'];
			options = ['additional_documents_required'];
		} else if (role === 'lender') {
			let hasAmount = false;
			let currentStatus = '';

			if (statusEditOrder?.lenderActions?.length > 0) {
				const lastLenderAction =
					statusEditOrder.lenderActions[statusEditOrder.lenderActions.length - 1];
				currentStatus = (lastLenderAction?.status || '').toLowerCase();
				if (lastLenderAction?.amount !== undefined || lastLenderAction?.loan_amount !== undefined) {
					hasAmount = true;
				}
			}

			if (hasAmount) {
				const statusFlow = [
					'additional_documents_required',
					'kyc_done',
					'nach_setup',
					'bill_upload_required',
					'do_released',
					'partial_disbursed',
					"partial_settled",
					'emi_started_by_customer',
					'disbursed',
					'settled',
					'amount_paid_by_customer',
					'emi_bounced_by_1month',
					'emi_bounced_by_3months',
					'npa'
				];
				
				// options = ['rejected', ...statusFlow];
				options = [ ...statusFlow];

				const resolvedStatus = (statusEditOrder?.rawRoleStatus || currentStatus).toLowerCase();
				let flowIndex = statusFlow.indexOf(resolvedStatus);
                // Also check if any lenderAction matches
                if (flowIndex === -1 && statusEditOrder?.lenderActions) {
                    for (let i = statusEditOrder.lenderActions.length - 1; i >= 0; i--) {
                        const idx = statusFlow.indexOf((statusEditOrder.lenderActions[i].status || '').toLowerCase());
                        if (idx !== -1) {
                            flowIndex = idx;
                            break;
                        }
                    }
                }

				if (flowIndex !== -1) {
					for (let i = 0; i <= flowIndex; i++) {
						disabledOptions.add(statusFlow[i]);
					}
				}
			} else {
				// options = ['rejected', 'additional_documents_required'];
				options = ['additional_documents_required'];
			}
		}

		let currentRoleStatus = (statusEditOrder?.rawRoleStatus || '').toLowerCase();
		if (role === 'lender' && statusEditOrder?.lenderActions?.length > 0) {
			currentRoleStatus = (statusEditOrder.lenderActions[statusEditOrder.lenderActions.length - 1].status || '').toLowerCase();
		} else if (role === 'doctor' && statusEditOrder?.doctorActions?.length > 0) {
			currentRoleStatus = (statusEditOrder.doctorActions[statusEditOrder.doctorActions.length - 1].status || '').toLowerCase();
		}

		return options.map((opt) => {
			let labelText = opt;
			if (opt.toLowerCase() === 'additional_documents_required') {
				labelText = 'documents_required';
			}
			return {
				value: opt,
				isDisabled: disabledOptions.has(opt) || opt.toLowerCase() === currentRoleStatus,
				label: labelText
					.split(/[_\s]+/)
					.map((word) => {
						if (word.toLowerCase() === 'kyc') return 'KYC';
						if (word.toLowerCase() === 'nach') return 'NACH';
						if (word.toLowerCase() === 'do') return 'DO';
						if (word.toLowerCase() === 'emi') return 'EMI';
						if (word.toLowerCase() === 'npa') return 'NPA';
						if (word.toLowerCase() === 'utr') return 'UTR';
						return word.charAt(0).toUpperCase() + word.slice(1);
					})
					.join(' ')
			};
		});
	});

	let orderDocuments = $derived.by(() => {
		if (!selected_order_for_files) return [];

		const docs = [];
		const documents = selected_order_for_files.documents;

		function hasValidDocuments(obj) {
			if (!obj) return false;
			for (const value of Object.values(obj)) {
				if (Array.isArray(value) && value.length > 0) return true;
				if (typeof value === 'string' && value.trim() !== '') return true;
				if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
					if (hasValidDocuments(value)) return true;
				}
			}
			return false;
		}

		function processDocNode(docObject, currentBucket = null) {
			if (!docObject) return;
			for (const [key, value] of Object.entries(docObject)) {
				if (!value) continue;

				if (Array.isArray(value)) {
					if (value.length === 0) continue;
					
					const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
					const finalName = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
					
					let arrDocs = [];
					value.forEach((url, i) => {
						if (url) {
							arrDocs.push({ name: `Document ${i + 1}`, url: url });
						}
					});
					
					docs.push({ 
						type: 'array', 
						name: finalName, 
						rawKey: key, 
						bucket: currentBucket, 
						files: arrDocs 
					});
				} else if (typeof value === 'object' && value !== null) {
					if (!hasValidDocuments(value)) continue;

					let nextBucket = currentBucket;
					if (key === 'doctorDoc') { 
						nextBucket = 'doctor';
						docs.push({ type: 'divider', name: 'Doctor' });
					}
					else if (key === 'lenderDoc') { 
						nextBucket = 'lender';
						docs.push({ type: 'divider', name: 'Lender' });
					}
					processDocNode(value, nextBucket);
				} else if (typeof value === 'string') {
					const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
					const finalName = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
					docs.push({ type: 'single', name: finalName, url: value, rawKey: key, bucket: currentBucket });
				}
			}
		}

		if (documents) {
			processDocNode(documents);
		}

		return docs;
	});

	function formatAmount(amt) {
		if (amt === '-' || amt === undefined || amt === null || amt === '') return '-';
		const num = Number(amt);
		if (isNaN(num) || num === 0) return '-';
		return Number.isInteger(num) ? String(num) : num.toFixed(2);
	}

	function handleInput() {
		currentPage = 1;
	}
	function onPageChange(newPage) {
		currentPage = newPage;
	}

	let maxAllowedLoanAmount = $derived.by(() => {
		if (!statusEditOrder) return 0;
		if (statusEditOrder?.lenderActions && statusEditOrder.lenderActions.length > 0) {
			for (let i = statusEditOrder.lenderActions.length - 1; i >= 0; i--) {
				const action = statusEditOrder.lenderActions[i];
				// Prioritise amount.$numberDecimal (IFL stores approved amount here) over loan_amount
				const a =
					action.amount?.$numberDecimal ||
					(typeof action.amount === 'number' ? action.amount : null) ||
					action.loan_amount?.$numberDecimal ||
					action.loan_amount;
				if (a) return Number(a);
			}
		}
		return Number(
			statusEditOrder?.kyc?.loan_amount ||
				statusEditOrder?.kyc_done?.loan_amount ||
				statusEditOrder?.requestedAmount?.$numberDecimal ||
				statusEditOrder?.requestedAmount ||
				0
		);
	});

	let computedPartialDisbursedAmount = $derived.by(() => {
		if (!statusEditOrder) return 0;
		if (statusEditOrder?.lenderActions && statusEditOrder.lenderActions.length > 0) {
			for (let i = statusEditOrder.lenderActions.length - 1; i >= 0; i--) {
				const action = statusEditOrder.lenderActions[i];
				const a = action.partial_disbursed_amount?.$numberDecimal || action.partial_disbursed_amount;
				if (a) return Number(a);
			}
		}
		return Number(statusEditOrder?.partial_disbursal?.partial_disbursed_amount || 0);
	});

	let isFormValidForStatus = $derived.by(() => {
		if (!newStatus || newStatus === '') return true; // valid if just nothing is selected

		if (newStatus === 'kyc_done' || newStatus === 'kyc') {
			return true
			// if (!statusFormData.loanAmount) return false;
			// const docAmtRaw =
			// 	statusEditOrder?.doctorActions?.[statusEditOrder.doctorActions.length - 1]?.amount
			// 		?.$numberDecimal;
			// if (Number(statusFormData.loanAmount) > Number(docAmtRaw)) return false;
		} else if (newStatus === 'bill_upload_required') {
			return true;
		} else if (newStatus === 'nach_setup') {
			const accountRegex = /^\d{9,18}$/;
			const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
			if (!statusFormData.prefBankAccount || !accountRegex.test(statusFormData.prefBankAccount)) return false;
			if (!statusFormData.prefIfsc || !ifscRegex.test(statusFormData.prefIfsc.toUpperCase())) return false;
		} else if (newStatus === 'partial_settled') {
			if (!statusFormData.utrNumber) return false;
		} else if (newStatus === 'do_released' || newStatus === 'do_release') {
			return true
		} else if (newStatus === 'partial_disbursal' || newStatus === 'partial_disbursed') {
			if (!statusFormData.partialDisbursedAmount) return false;
			if (maxAllowedLoanAmount > 0 && Number(statusFormData.partialDisbursedAmount) > maxAllowedLoanAmount) return false;
		} else if (newStatus === 'complete_disbursal' || newStatus === 'disbursed') {
			if (!statusFormData.finalDisbursalAmount) return false;
			const partialAmt = computedPartialDisbursedAmount;
			if (partialAmt + Number(statusFormData.finalDisbursalAmount) > maxAllowedLoanAmount) return false;
		} else if (newStatus === 'settled') {
			if (!statusFormData.finalUtrNumber) return false;
		}

		return true;
	});

	async function handleReject() {
		if (!rejection_reason) {
			toast.update('Error', 'Please provide a rejection reason', 'failed');
			return;
		}

		buttonActive = true;
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}${baseEndpoint}/reject`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: rejection_order?.orderId,
					reason: rejection_reason
				})
			});

			const data = await res.json();

			if (res.ok) {
				toast.update('Success', data.message || 'Order rejected successfully', 'success');

				rejection_reason = '';
				rejection_order = null;
				await loadData();
			} else {
				toast.update('Error', data.message || 'Rejection Failed', 'failed');
			}
		} catch (e) {
			toast.update('Error', 'Server connection failed', 'failed');
			console.error(e);
		} finally {
			buttonActive = false;
		}
	}

	async function updateStatus(order, status) {
		buttonActive = true;
		try {
			const roleKey = user.role?.toLowerCase()?.trim() === 'doctor' ? 'doctor' : 'lender';

			const payload = {
				orderId: order?.orderId,
				key: roleKey,
				status: status
			};

			if (status === 'kyc_done' || status === 'kyc') {
				// payload.loan_amount = Number(statusFormData.loanAmount);
			} else if (status === 'bill_upload_required') {
				// No extra text fields needed; only file, orderId, key and status are sent
			} else if (status === 'nach_setup') {
				payload.borrower_bank_account = statusFormData.prefBankAccount;
				payload.borrower_bank_ifsc = statusFormData.prefIfsc;
			} else if (status === 'partial_settled') {
				payload.utr_number = statusFormData.utrNumber;
			} else if (status === 'do_release' || status === 'do_released') {
				payload.pod_number = statusFormData.podNumber;
			} else if (status === 'partial_disbursal' || status === 'partial_disbursed') {
				payload.utr_number = statusFormData.utrNumber;
				payload.partial_disbursed_amount = Number(statusFormData.partialDisbursedAmount);
			} else if (status === 'complete_disbursal' || status === 'disbursed') {
				payload.final_disbursal_amount = Number(statusFormData.finalDisbursalAmount);
			} else if (status === 'settled') {
				payload.final_utr_number = statusFormData.finalUtrNumber;
			}

			let res;

			res = await fetch(`${PUBLIC_API_BASE_URL}/api/reimbursement/status`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const data = await res.json();

			if (res.ok) {
				toast.update('Success', data.message || 'Status updated successfully', 'success');

				newStatus = '';
				statusEditOrder = null;
				await loadData();
			} else {
				toast.update('Error', data.message || 'Status update failed', 'failed');
			}
		} catch (e) {
			toast.update('Error', 'Server connection failed', 'failed');
			console.error(e);
		} finally {
			buttonActive = false;
		}
	}

	async function uploadAdditionalDocs() {
		if (!additionalFiles || additionalFiles.length === 0) return;
		buttonActive = true;

		try {
			const formData = new FormData();
			formData.append('orderId', selected_order_for_files.orderId);

			// const reqRole = selected_order_for_files.workflowStage === 'doctor_review' ? 'doctor' : 'lender';
			// formData.append('key', reqRole);

			additionalFiles.forEach((f) => {
				formData.append('additionalDocuments', f);
			});

			const uploadRes = await fetch(`${PUBLIC_API_BASE_URL}/api/reimbursement/document`, {
				method: 'POST',
				credentials: 'include',
				body: formData
			});

			const data = await uploadRes.json();
			if (uploadRes.ok) {
				toast.update('Success', 'Additional documents uploaded successfully', 'success');
				additionalFiles = [];
				await loadData();
				selected_order_for_files = rows.find(r => r.orderId === selected_order_for_files.orderId) || selected_order_for_files;
			} else {
				toast.update('Error', data.message || 'Failed to upload documents', 'failed');
			}
		} catch (e) {
			toast.update('Error', 'Server connection failed while uploading', 'failed');
			console.error(e);
		} finally {
			buttonActive = false;
		}
	}

	async function submitRmUpload() {
		if (!rmUploadFormData.cancelledCheque || !rmUploadFormData.finalBill || rmUploadFormData.cancelledCheque.length === 0 || rmUploadFormData.finalBill.length === 0) {
			toast.update('Error', 'Please provide both Cancelled Cheque and Final Bill files', 'failed');
			return;
		}
		
		buttonActive = true;
		try {
			const formData = new FormData();
			formData.append('orderId', rmUploadOrder.orderId);
			formData.append('key', 'lender');
			formData.append('cancelledCheque', rmUploadFormData.cancelledCheque[0]);
			formData.append('finalBill', rmUploadFormData.finalBill[0]);

			const uploadRes = await fetch(`${PUBLIC_API_BASE_URL}/api/reimbursement/document`, {
				method: 'POST',
				credentials: 'include',
				body: formData
			});

			const data = await uploadRes.json();
			if (uploadRes.ok) {
				toast.update('Success', 'Bill and Cheque uploaded successfully', 'success');
				rmUploadOrder = null;
				rmUploadFormData = { cancelledCheque: null, finalBill: null };
				await loadData();
			} else {
				toast.update('Error', data.message || 'Upload failed', 'failed');
			}
		} catch (e) {
			toast.update('Error', 'Server connection failed', 'failed');
			console.error(e);
		} finally {
			buttonActive = false;
		}
	}



	let replacingDocIndex = $state(null);

	async function replaceDocument(e, doc, idx) {
		const file = e.target.files[0];
		if (!file) return;
		
		replacingDocIndex = idx;
		try {
			const formData = new FormData();
			formData.append('orderId', selected_order_for_files.orderId);
			// Backend expects 'lender' or 'doctor', so fallback to lender if not populated
			formData.append('key', doc.bucket || 'lender'); 
			formData.append(doc.rawKey, file);

			const uploadRes = await fetch(`${PUBLIC_API_BASE_URL}/api/reimbursement/document`, {
				method: 'POST',
				credentials: 'include',
				body: formData
			});

			const data = await uploadRes.json();
			if (uploadRes.ok) {
				toast.update('Success', 'Document replaced successfully', 'success');
				await loadData();
				selected_order_for_files = rows.find(r => r.orderId === selected_order_for_files.orderId) || selected_order_for_files;
			} else {
				toast.update('Error', data.message || 'Failed to replace document', 'failed');
			}
		} catch (e) {
			toast.update('Error', 'Server connection failed while replacing', 'failed');
			console.error(e);
		} finally {
			replacingDocIndex = null;
		}
	}

	async function handleIngest(row) {
		const inputVal = Number(inputsData[row.orderId]);
		const role = user.role?.toLowerCase()?.trim();

		if (!inputsData[row.orderId] || isNaN(inputVal) || inputVal <= 0) {
			toast.update('Error', 'Please enter a valid amount', 'failed');
			return;
		}

		if (role === 'lender') {
			const maxLenderAmount = Number(row.doctorAmountRaw);
			if (isNaN(maxLenderAmount)) {
				toast.update('Error', "Doctor's Amount is missing. Cannot approve.", 'failed');
				return;
			}
			if (inputVal > maxLenderAmount) {
				toast.update(
					'Error',
					`Amount cannot exceed Doctor's Amount (${maxLenderAmount})`,
					'failed'
				);
				return;
			}
		} else {
			const maxDocAmount = Number(row.requestedAmount);
			if (isNaN(maxDocAmount)) {
				toast.update('Error', 'Requested Amount is missing.', 'failed');
				return;
			}
			if (inputVal > maxDocAmount) {
				toast.update('Error', `Amount cannot exceed Requested Amount (${maxDocAmount})`, 'failed');
				return;
			}
		}

		buttonActive = true;
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}${baseEndpoint}/submit`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ orderId: row.orderId, requestedAmount: inputsData[row.orderId] })
			});
			const data = await res.json();
			if (res.ok) {
				const verb = role === 'lender' || role === 'doctor' ? 'Approved' : 'Ingested';
				const failVerb = role === 'lender' || role === 'doctor' ? 'Approval' : 'Ingestion';
				toast.update(
					data.statusMessage ? 'Success' : 'Error',
					data.statusMessage ? `Order ${verb} successfully` : `Order ${failVerb} Failed`,
					data.statusMessage ? 'success' : 'failed'
				);
				await loadData();
			} else {
				toast.update('Error', data.message, 'failed');
			}
		} catch (e) {
			toast.update('Error', 'Server connection failed', 'failed');
		} finally {
			buttonActive = false;
		}
	}

	let orderConfig = $derived.by(() => {
		const role = user.role?.toLowerCase()?.trim();
		const columns = [
			{
				label: 'Hospital',
				key: 'hospitalName',
				width: '140px',
				display: 'always',
				type: 'text',
				isImportant: true
			},
			{
				label: 'Borrower',
				key: 'borrowerName',
				width: '300px',
				display: 'always',
				type: 'text'
			}
		];

		if (role === 'relationship_manager') {
			columns.push({
				label: 'Doctor Status',
				key: 'doctorActionStatus',
				width: '160px',
				display: 'always',
				type: 'status_with_edit'
			});
			columns.push({
				label: 'Lender Status',
				key: 'lenderActionStatus',
				width: '160px',
				display: 'always',
				type: 'status_with_edit'
			});
		} else {
			columns.push({
				label: 'Status',
				key: 'roleDisplayStatus',
				width: '200px',
				display: 'desktop',
				type: 'status_with_edit',
				hasEdit: role === 'lender' || role === 'doctor',
				onEdit: (row) => {
					statusEditOrder = row;
					newStatus = '';
				}
			});
		}

		columns.push(
			{
				label: 'Lender',
				key: 'lenderCode',
				width: '100px',
				display: 'always',
				type: 'tag'
			},
			{
				label: 'Uploaded file',
				key: 'policyDocument',
				width: '130px',
				display: 'always',
				type: 'url'
			},
			{
				label: 'Requested Amount',
				key: 'requestedAmountText',
				width: '140px',
				display: 'always',
				type: 'text'
			}
		);

		if (role === 'doctor') {
			columns.push({
				label: "Doctor's Amount",
				key: 'amount_input',
				width: '140px',
				display: 'always',
				type: 'input',
				disable_key: 'doctor_disable_input'
			});
			columns.push({
				label: "Lender's Amount",
				key: 'lenderAmountText',
				width: '140px',
				display: 'always',
				type: 'text'
			});
		} else if (role === 'relationship_manager') {
			let reqAmtCol = columns.find((c) => c.label === 'Requested Amount');
			if (reqAmtCol) {
				reqAmtCol.key = 'amount_input';
				reqAmtCol.type = 'input';
				reqAmtCol.disable_key = 'rm_disable_input';
			}
			columns.push({
				label: "Doctor's Amount",
				key: 'doctorAmountText',
				width: '140px',
				display: 'always',
				type: 'text'
			});
			columns.push({
				label: "Lender's Amount",
				key: 'lenderAmountText',
				width: '140px',
				display: 'always',
				type: 'text'
			});
		} else if (role === 'lender') {
			columns.push({
				label: "Doctor's Amount",
				key: 'doctorAmountText',
				width: '140px',
				display: 'always',
				type: 'text'
			});
			columns.push({
				label: "Lender's Amount",
				key: 'amount_input',
				width: '140px',
				display: 'always',
				type: 'input',
				disable_key: 'isCompleted'
			});
		}

		columns.push({
			label: 'Action',
			key: 'isCompleted',
			width: '150px',
			display: 'always',
			type: 'double_action_button',
			button_one_label: role === 'lender' || role === 'doctor' ? 'Approve' : 'Ingest',
			button_two_label: 'Reject',
			oneclick_one: (row) => {
				handleIngest(row);
			},
			onclick_two: (row) => {
				rejection_order = row;
			}
		});

		return columns;
	});
	// $inspect(inputsData);
	$effect(async () => {
		loadData();
	});
	function handleFileClick(e, url) {
		e.preventDefault();
		e.stopPropagation();

		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer');
		} else {
			toast.update('Error', 'File URL not found', 'failed');
		}
	}
	async function loadData() {
		const isSearch = value.trim().length > 0;
		if (rejection_order) {
			return;
		}
		let params = new URLSearchParams({
			page: String(currentPage),
			limit: '10',
			query: value ? value : ''
		});
		if (isSearch) {
			loading = true;
			params.append('search', value);
			// params.append('context', 'hospital');
		}
		try {
			const response = await fetch(
				`${PUBLIC_API_BASE_URL}${baseEndpoint}/pending?${params.toString()}`,
				{
					method: 'GET',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			let { orders, totalPages: pageCount } = await response.json();
			
			function formatStatusLabel(statusVal) {
				if (!statusVal || statusVal === '-') return '-';
				if (statusVal.toLowerCase() === 'additional_documents_required') {
					return 'DOCUMENT REQUIRED';
				}
				return statusVal.replace(/_/g, ' ').toUpperCase();
			}

			orders = orders.map((order) => {
				let isCompleted = false;
				let actionStatus = null;
				const role = user.role?.toLowerCase()?.trim();

				if (role === 'lender') {
					isCompleted = order.workflowStage !== 'lender_review';
					if (isCompleted) {
						actionStatus = formatStatusLabel(order.status);
					}
				} else if (role === 'relationship_manager') {
					if (order.lenderCode === 'IFL') {
						isCompleted = true;
						actionStatus = formatStatusLabel(order.status);
					} else {
						isCompleted = order.is_checked_by_ops;
						if (isCompleted) {
							actionStatus = formatStatusLabel(order.status);
						}
					}
				} else if (role === 'doctor') {
					const latestDocStatus = (order.doctorActions?.[order.doctorActions.length - 1]?.status || '').replace(/ /g, '_').toLowerCase();
					// bill_uploaded is an actionable state — doctor must verify or reject
					const isBillUploaded = latestDocStatus === 'bill_uploaded';
					isCompleted = !isBillUploaded && order.workflowStage !== 'doctor_review';
					if (isCompleted) {
						actionStatus = formatStatusLabel(order.status);
					}
				}

				const docAmtRaw =
					order.doctorActions?.[order.doctorActions.length - 1]?.amount?.$numberDecimal;
				const lenderAmtRaw =
					order.lenderActions?.[order.lenderActions.length - 1]?.amount?.$numberDecimal ||
					order.lenderActions?.[order.lenderActions.length - 1]?.loan_amount;

				const normalizeStatus = (s) => (s || '').replace(/ /g, '_').toLowerCase();

				const rawDocStatus = (() => {
					const latestDocAction = order.doctorActions?.[order.doctorActions.length - 1];
					return normalizeStatus(latestDocAction?.status || order.status || '-');
				})();
				const docStatus = formatStatusLabel(rawDocStatus);

				const rawLenderStatus = (() => {
					const latestLenderAction = order.lenderActions?.[order.lenderActions.length - 1];
					return normalizeStatus(latestLenderAction?.status || order.status || '-');
				})();
				const lenderStatus = formatStatusLabel(rawLenderStatus);

				const normalStatusDisplay = formatStatusLabel(normalizeStatus(order.status));

				let roleDisplayStatus = normalStatusDisplay;
				let rawRoleStatus = normalizeStatus(order.status || '-');

				if (role === 'doctor') {
					roleDisplayStatus = docStatus;
					rawRoleStatus = rawDocStatus;
				} else if (role === 'lender') {
					// Only override visually when lender is still at bill_upload_required AND doctor has verified
					if (rawLenderStatus === 'bill_upload_required' && rawDocStatus === 'bill_verified') {
						rawRoleStatus = 'bill_verified';
						roleDisplayStatus = formatStatusLabel('bill_verified');
					} else {
						roleDisplayStatus = lenderStatus;
						rawRoleStatus = rawLenderStatus;
					}
				}
				const lenderRawStatus = rawLenderStatus;

				if ((order.status || '').toLowerCase().includes('reject') || (rawRoleStatus || '').toLowerCase().includes('reject')) {
					isCompleted = true;
				}

				if (role === 'doctor') {
					inputsData[order?.orderId] = docAmtRaw ? Number(docAmtRaw) : '';
				} else if (role === 'lender') {
					inputsData[order?.orderId] = lenderAmtRaw ? Number(lenderAmtRaw) : '';
				} else if (role === 'relationship_manager') {
					if (order.lenderCode !== 'IFL' && !isCompleted) {
						inputsData[order?.orderId] = 0;
					} else {
						inputsData[order?.orderId] = order.requestedAmount;
					}
				} else {
					inputsData[order?.orderId] = order.requestedAmount;
				}

				let rm_disable_input = false;
				let doctor_disable_input = false;

				if (role === 'relationship_manager') {
					rm_disable_input = isCompleted;
				} else if (role === 'doctor') {
					// Doctor amount is locked if they already submitted an amount, or if lender amount is already present
					doctor_disable_input = isCompleted || (docAmtRaw !== undefined && docAmtRaw !== null && docAmtRaw !== '') || (lenderAmtRaw !== undefined && lenderAmtRaw !== null && lenderAmtRaw !== '');
				}

				return {
					...order,
					isCompleted,
					rm_disable_input,
					doctor_disable_input,
					actionStatus,
					roleDisplayStatus,
					rawRoleStatus,
					lenderRawStatus,
					doctorActionStatus: docStatus,
					lenderActionStatus: lenderStatus,
					requestedAmountText: formatAmount(order.requestedAmount),
					doctorAmountText: formatAmount(docAmtRaw),
					lenderAmountText: formatAmount(lenderAmtRaw),
					doctorAmountRaw: docAmtRaw,
					created_at: order.created_at
						? new Date(order.created_at).toLocaleDateString().split('T')[0]
						: '-',
					order_closure: order.OrderClosure || false,
					status: order.status || '-',
					disbursedAmount: order.status?.disbursedAmount?.$numberDecimal || '-'
				};
			});
			totalPages = pageCount || 1;
			console.log(totalPages);
			rows = orders;
		} catch (error) {
			console.error('Fetch failed:', error);
			rows = [];
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col w-full p-6">
	<div
		class="flex flex-col lg:flex-row lg:items-stretch justify-between px-2 lg:px-8 py-2 lg:py-4 border-b border-slate-200 bg-white gap-4 lg:gap-0"
	>
		<div class="self-start flex flex-col gap-1 w-full">
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
				Queue Management
			</span>
			<h2 class="text-sm font-bold text-slate-700 ml-1">Reimbursement Orders Pending OPS Check</h2>
		</div>
		<!-- <div class="flex items-center lg:self-end w-full lg:w-auto">
		<button
			onclick={onboard}
			class="w-full lg:w-auto shrink-0 flex gap-3 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-3 px-6 text-white rounded-2xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all group"
		>
			<span class="text-sm">Add Hospital</span>
			<Plus size={18} class="group-hover:rotate-90 transition-transform duration-300" />
		</button>
	</div> -->
	</div>

	<div class="overflow-x-auto">
		<table
			class=" mt-5 w-full lg:max-w-full border-separate border-spacing-y-2 lg:border-spacing-y-0 border-spacing-x-0"
		>
			{@render tableHeader(orderConfig)}

			<tbody class="before:block before:leading-[0] before:content-['-'] before:text-transparent">
				{#each rows as row, i (i)}
					{@render tableRow(orderConfig, row, i)}

					{#if expandedIndex === i && card}
						<tr>
							<td colspan={orderConfig.length} class="p-0 lg:relative">
								<div
									class="fixed lg:static inset-x-0 top-1/2 -translate-y-1/2 lg:translate-y-0 z-40 lg:z-auto
               w-xs lg:max-w-none lg:w-full mx-auto
                bg-white border lg:border-[#ad5389]/40 shadow-2xl lg:shadow-none
                rounded-none lg:rounded-b-2xl
                flex flex-col max-h-[90vh] lg:max-h-none"
								>
									<div
										class="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100 lg:hidden"
									>
										<span class="text-xs font-bold uppercase tracking-widest text-slate-500"
											>Order Information</span
										>
										<button
											onclick={() => (expandedIndex = null)}
											class="p-2 bg-white rounded-full shadow-sm text-slate-400 active:scale-95"
										>
											<X size={20} />
										</button>
									</div>

									<div
										class="custom-scrollbar overflow-y-auto p-6 lg:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-6"
									>
										{#each orderConfig as col (col.key)}
											{#if col.type === 'action_button'}
												<div
													class="flex flex-col py-6 border-b border-slate-50 lg:border-0 lg:py-0 order-first lg:order-last sm:col-span-2 lg:col-span-1"
												>
													<button
														disabled={buttonActive}
														onclick={(e) => {
															e.stopPropagation();
															expandedIndex = null;
															popupData = row;
														}}
														class="w-full shrink-0 flex gap-3 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-4 px-6 text-white rounded-2xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all shadow-lg"
													>
														<span class="text-sm">Login</span>
														<LogInIcon size={18} />
													</button>
												</div>
											{:else if col.type == 'input'}
												<div
													class="relative flex lg:flex-row flex-col lg:items-center items-start {row[
														col.disable_key
													]
														? 'cursor-not-allowed'
														: 'cursor-pointer'}"
												>
													<label class="lg:hidden inline-block text-slate-400 font-semibold text-xs"
														>{col.label}:</label
													>
													<input
														bind:value={inputsData[row.orderId]}
														disabled={row[col.disable_key]}
														onclick={(e) => e.stopPropagation()}
														type="number"
														placeholder=""
														class="lg:w-32 w-full py-3 pl-4 pr-6 bg-white border border-slate-200 rounded-2xl outline-none transition-all duration-300
						   placeholder:text-slate-400 text-slate-900
						   hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-100 disabled:cursor-not-allowed
						   focus:border-[#ad5389] focus:ring-4 focus:ring-[#ad5389]/10"
													/>
												</div>
											{:else if col.type == 'double_action_button'}
												<div class="flex items-center gap-2">
													{#if user.role === 'relationship_manager' && row.lenderCode === 'IFL' && ((row.rawRoleStatus || '').toLowerCase().replace(/ /g, '_') === 'bill_upload_required' || (row.doctorActions?.[row.doctorActions.length - 1]?.status || '').toLowerCase().replace(/ /g, '_') === 'reupload_bill') && !row.doctorActions?.some((a) => (a.status || '').replace(/ /g, '_').toLowerCase() === 'bill_uploaded')}
														<button
															disabled={buttonActive}
															onclick={(e) => {
																e.stopPropagation();
																rmUploadOrder = row;
															}}
															class="flex-1 lg:w-auto shrink-0 flex gap-2 bg-[#ad5389] hover:bg-white hover:text-[#ad5389] hover:border-[#ad5389] text-white font-bold items-center justify-center py-2 px-4 rounded-2xl cursor-pointer border border-transparent transition-all disabled:opacity-50 shadow-md"
														>
															<span class="text-xs">Upload Bill</span>
															<Upload size={16} />
														</button>
													{:else if user.role === 'doctor' && row.rawRoleStatus === 'bill_uploaded'}
														<button
															disabled={buttonActive}
															onclick={(e) => {
																e.stopPropagation();
																billVerifyOrder = row;
															}}
															class="flex-1 lg:w-auto shrink-0 flex gap-2 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-2 px-4 text-white rounded-2xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all group/one disabled:opacity-50 shadow-md"
														>
															<span class="text-xs">Verify Bill</span>
															<CheckCircle size={16} class="group-hover/one:scale-110 transition-transform duration-300" />
														</button>
													{:else if !row[col.key]}
														<button
															disabled={buttonActive}
															onclick={(e) => {
																e.stopPropagation();
																col.oneclick_one(row);
															}}
															class="flex-1 lg:w-auto shrink-0 flex gap-2 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-2 px-4 text-white rounded-2xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all group/one disabled:opacity-50 disabled:cursor-not-allowed"
														>
															<span class="text-xs">{col.button_one_label}</span>
															<CheckCircle
																size={16}
																class="group-hover/one:scale-110 transition-transform duration-300"
															/>
														</button>

														<button
															disabled={buttonActive}
															onclick={(e) => {
																e.stopPropagation();
																col.onclick_two(row);
															}}
															class="flex-1 lg:w-auto shrink-0 flex gap-2 bg-white text-slate-500 hover:text-red-600 font-bold items-center justify-center py-2 px-4 rounded-2xl border border-slate-200 hover:border-red-600 cursor-pointer transition-all group/two disabled:opacity-50 disabled:cursor-not-allowed"
														>
															<span class="text-xs">{col.button_two_label}</span>
															<XCircle
																size={16}
																class="group-hover/two:rotate-90 transition-transform duration-300"
															/>
														</button>
													{:else}
														<p
															class="text-slate-400 text-[11px] lg:text-xs font-bold uppercase text-center w-full"
														>
															{row.actionStatus || 'Completed'}
														</p>
													{/if}
												</div>
											{:else if col.type === 'url'}
												<div class="flex flex-col truncate">
													<button
														onclick={(e) => {
															e.stopPropagation();
															selected_order_for_files = row;
														}}
														class="w-full lg:w-auto shrink-0 flex gap-3 bg-white text-blue-500 font-semibold items-center justify-center py-3 px-6 rounded-2xl border border-transparent hover:border-blue-500 cursor-pointer transition-all group/link"
													>
														<span class="text-sm">View Files</span>
														<ExternalLink
															size={18}
															class="transition-transform duration-300 group-hover/link:-translate-y-1 group-hover/link:translate-x-1"
														/>
													</button>
												</div>
											{:else if row[col.key]}
												<div
													class="flex items-center justify-between py-4 lg:py-0 border-b border-slate-50 lg:border-0"
												>
													<div class="flex flex-col min-w-0">
														<span
															class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1"
														>
															{col.label || col.key}
														</span>
														<span class="text-base font-semibold text-slate-800 break-words">
															{row[col.key]}
														</span>
													</div>

													<div class="flex items-center gap-2 lg:hidden">
														{#if col.hasCopy}
															<button
																onclick={() => navigator.clipboard.writeText(row[col.key])}
																class="p-2 text-slate-400 bg-slate-50 rounded-lg"
															>
																<Copy size={16} />
															</button>
														{/if}
													</div>
												</div>
											{/if}
										{/each}
									</div>
								</div>

								<div
									role="presentation"
									onclick={() => (expandedIndex = null)}
									class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
								></div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
		{@render Pagination({
			currentPage,
			hasNextPage: currentPage < totalPages,
			onPageChange
		})}
	</div>
</div>
{#if !rows.length}
	{@render noResults()}
{/if}

{#snippet tableHeader(column_data)}
	<thead class="hidden lg:table-header-group">
		<tr class="bg-gray-100">
			{#each column_data as column, i (i)}
				<th
					class="text-left text-slate-500 text-[12px] p-4 font-semibold uppercase first:rounded-tl-2xl last:rounded-tr-2xl"
				>
					{column.label}
				</th>
			{/each}
		</tr>
	</thead>
{/snippet}

{#snippet tableRow(column_data, row, index)}
	<tr
		onclick={() => {
			expandedIndex = expandedIndex === index ? null : index;
		}}
		class="group transition-all cursor-pointer min-w-full
        {expandedIndex === index ? 'bg-slate-50' : 'bg-white'}"
	>
		{#each column_data as column, idx (idx)}
			<td
				class="
                    {column.isImportant ? 'table-cell ' : 'hidden lg:table-cell'} 
                    p-4 transition-all duration-200
                    

                    lg:border-t-1 lg:border-b-1 lg:border-x-0
                    

                    lg:first:border-l-1 lg:last:border-r-1
                    

                    group-hover:border-[#ad5389]/40
                    

                    {expandedIndex === index
					? 'border-y-[#ad5389]/40 border-x-[#ad5389]/40 lg:border-b-transparent'
					: 'border-t-transparent border-x-transparent border-b-slate-100 group-hover:border-b-[#ad5389]/40'}
                    

                    max-lg:border-2 max-lg:rounded-xl
                "
			>
				<div class="flex items-center justify-between gap-4">
					{#if column.type == 'url'}
						<div class="flex flex-col truncate">
							<button
								onclick={(e) => {
									e.stopPropagation();
									selected_order_for_files = row;
								}}
								class="w-full lg:w-auto shrink-0 flex gap-2 bg-white text-blue-500 font-semibold items-center justify-center py-2 px-4 rounded-xl border border-transparent hover:border-blue-500 cursor-pointer transition-all group/link"
							>
								<span class="text-[13px]">View Files</span>
								<ExternalLink
									size={16}
									class="transition-transform duration-300 group-hover/link:-translate-y-1 group-hover/link:translate-x-1"
								/>
							</button>
						</div>
					{:else if column.type == 'input'}
						<div
							class="relative flex items-center {row[column.disable_key]
								? 'cursor-not-allowed'
								: 'cursor-pointer'}"
						>
							<input
								bind:value={inputsData[row.orderId]}
								disabled={row[column.disable_key]}
								onclick={(e) => e.stopPropagation()}
								type="number"
								placeholder=""
								class="w-32 py-2 pl-3 pr-4 bg-white border border-slate-200 rounded-xl outline-none transition-all duration-300 text-sm
					   placeholder:text-slate-400 text-slate-900
					   hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-100 disabled:cursor-not-allowed
					   focus:border-[#ad5389] focus:ring-4 focus:ring-[#ad5389]/10"
							/>
						</div>
					{:else if column.type == 'double_action_button'}
						<div class="flex items-center gap-2">
							{#if user.role === 'relationship_manager' && row.lenderCode === 'IFL' && ((row.rawRoleStatus || '').toLowerCase().replace(/ /g, '_') === 'bill_upload_required' || (row.doctorActions?.[row.doctorActions.length - 1]?.status || '').toLowerCase().replace(/ /g, '_') === 'reupload_bill') && !row.doctorActions?.some((a) => (a.status || '').replace(/ /g, '_').toLowerCase() === 'bill_uploaded')}
								<button
									disabled={buttonActive}
									onclick={(e) => {
										e.stopPropagation();
										rmUploadOrder = row;
									}}
									class="flex-1 lg:w-auto shrink-0 flex gap-1.5 bg-[#ad5389] hover:bg-white hover:text-[#ad5389] hover:border-[#ad5389] text-white font-bold items-center justify-center py-2 px-3 rounded-xl cursor-pointer border border-transparent transition-all disabled:opacity-50 shadow-md"
								>
									<span class="text-[11px] lg:text-xs">Upload Bill</span>
									<Upload size={15} />
								</button>
							{:else if user.role === 'doctor' && row.rawRoleStatus === 'bill_uploaded'}
								<button
									disabled={buttonActive}
									onclick={(e) => {
										e.stopPropagation();
										billVerifyOrder = row;
									}}
									class="flex-1 lg:w-auto shrink-0 flex gap-1.5 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-2 px-3 text-white rounded-xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all group/one disabled:opacity-50 shadow-md"
								>
									<span class="text-[11px] lg:text-xs">Verify Bill</span>
									<CheckCircle size={15} class="group-hover/one:scale-110 transition-transform duration-300" />
								</button>
							{:else if !row[column.key]}
								<button
									disabled={buttonActive}
									onclick={(e) => {
										e.stopPropagation();
										column.oneclick_one(row);
									}}
									class="flex-1 lg:w-auto shrink-0 flex gap-1.5 bg-slate-900 hover:bg-white hover:text-[#ad5389] font-bold items-center justify-center py-2 px-3 text-white rounded-xl border border-transparent hover:border-[#ad5389] cursor-pointer transition-all group/one disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<span class="text-[11px] lg:text-xs">{column.button_one_label}</span>
									<CheckCircle
										size={15}
										class="group-hover/one:scale-110 transition-transform duration-300"
									/>
								</button>

								<button
									disabled={buttonActive}
									onclick={(e) => {
										e.stopPropagation();
										column.onclick_two(row);
									}}
									class="flex-1 lg:w-auto shrink-0 flex gap-1.5 bg-white text-slate-500 hover:text-red-600 font-bold items-center justify-center py-2 px-3 rounded-xl border border-slate-200 hover:border-red-600 cursor-pointer transition-all group/two disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<span class="text-[11px] lg:text-xs">{column.button_two_label}</span>
									<XCircle
										size={15}
										class="group-hover/two:rotate-90 transition-transform duration-300"
									/>
								</button>
							{:else}
								<p
									class="text-slate-400 text-[11px] lg:text-xs font-bold uppercase text-center w-full"
								>
									{row.actionStatus || 'Completed'}
								</p>
							{/if}
						</div>
					{:else if column.type == 'action_button'}
						<div class="flex flex-col truncate">
							<button
								disabled={buttonActive}
								onclick={(e) => {
									e.stopPropagation();
									column.onclick(row._id);
								}}
								class="flex-1 lg:w-auto shrink-0 flex gap-2 bg-white text-slate-500 hover:text-red-600 font-bold items-center justify-center py-2 px-4 rounded-2xl border border-slate-200 hover:border-red-600 cursor-pointer transition-all group/two"
							>
								<span class="text-sm">Login</span>
								<LogIn
									size={18}
									class="group-hover/one:scale-110 transition-transform duration-300"
								/>
							</button>
						</div>
					{:else if column.type == 'tag'}
						<div class="flex flex-col truncate">
							{#if row[column.key]}
								<span
									class="inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-lg w-max"
								>
									{row[column.key]}
								</span>
							{:else}
								<span class="truncate text-slate-400 text-[13px] font-semibold lg:font-medium"
									>-</span
								>
							{/if}
						</div>
					{:else if column.type == 'status_with_edit'}
						{@const isSettled = (row.lenderActions || []).some(a => (a.status || '').toLowerCase() === 'settled') || (row.lenderRawStatus || '').toLowerCase() === 'settled'}
						<div class="flex items-center gap-2 truncate">
							{#if isSettled}
								<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
									<CheckCircle size={13} class="text-emerald-500 shrink-0" />
									<span class="truncate text-emerald-700 text-[12px] font-bold uppercase tracking-wide">
										{row[column.key] || 'Settled'}
									</span>
								</span>
							{:else}
								<span class="truncate text-slate-700 text-[13px] font-semibold lg:font-medium">
									{row[column.key] || '—'}
								</span>
							{/if}
						</div>
					{:else}
						<div class="flex flex-col truncate">
							<span class="truncate text-slate-700 text-[13px] font-semibold lg:font-medium">
								{column.key == '_id'
									? row[column.key]?.length > 10
										? row[column.key].slice(0, 8) + '...'
										: row[column.key]
									: row[column.key] || '—'}
							</span>
						</div>
					{/if}

					<div class="flex items-center gap-2 shrink-0">
						{#if column.hasCopy}
							<button
								disabled={buttonActive}
								onclick={(e) => {
									e.stopPropagation();
									navigator.clipboard.writeText(row[column.key]);
								}}
								class="p-2 -m-2 text-slate-400 hover:text-[#ad5389] cursor-pointer"
							>
								<Copy size={16} />
							</button>
						{/if}

						{#if column.hasEdit}
							{@const editCheckStatus = (user.role === 'lender' && row.lenderRawStatus) ? row.lenderRawStatus : (row.rawRoleStatus || '').toLowerCase()}
							{@const isStatusDisabled = ['completed', 'complete', 'reject', 'rejected', 'complete_settled', 'npa', 'settled', 'doctor_approved', 'doctor_rejected', 'bill_verified', 'bill_rejected'].includes(
								editCheckStatus
							) || (row.lenderActions || []).some(action => ['complete_settled', 'npa', 'settled'].includes((action.status || '').toLowerCase()))}
							<button
								disabled={buttonActive || isStatusDisabled}
								onclick={(e) => {
									e.stopPropagation();
									if (column.onEdit) column.onEdit(row);
								}}
								class="p-2 -m-2 {isStatusDisabled
									? 'text-slate-200 cursor-not-allowed'
									: 'text-slate-400 hover:text-[#ad5389] cursor-pointer'}"
							>
								<Edit size={16} />
							</button>
						{/if}

						<div class="lg:hidden text-slate-300 ml-1">
							<ChevronRight
								size={18}
								class="transition-transform duration-300 {expandedIndex === index
									? 'rotate-90 text-[#ad5389]'
									: ''}"
							/>
						</div>
					</div>
				</div>
			</td>
		{/each}
	</tr>
{/snippet}
{#if rejection_order}
	{@render popUpRejection()}
{/if}

{#if selected_order_for_files}
	{@render popUpFiles()}
{/if}

{#if statusEditOrder}
	{@render popUpStatusEdit()}
{/if}

{#snippet popUpStatusEdit()}
	<div
		class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
	>
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 flex flex-col"
		>
			<div class="flex items-center justify-between p-6">
				<div class="flex flex-col">
					<h2 class="text-2xl font-bold text-slate-800">Edit Status</h2>
					<p class="text-sm text-slate-500 font-mono mt-1">{statusEditOrder?.orderId}</p>
				</div>
				<button
					onclick={() => {
						statusEditOrder = null;
					}}
					class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
				>
					<X size={24} />
				</button>
			</div>

			<div class="px-8 pb-8 flex-1" class:disabled-style={buttonActive}>
				<div class="space-y-6">
					<div class="animate-in fade-in slide-in-from-top-2">
						<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
							New Status
						</label>
						<div class="relative w-full">
							<button
								type="button"
								onclick={() => (isStatusDropdownOpen = !isStatusDropdownOpen)}
								class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700 flex justify-between items-center"
							>
								<span class="font-medium">
									{newStatus
										? status_options.find((o) => o.value === newStatus)?.label || newStatus
										: 'Select a status...'}
								</span>
								<ChevronDown
									size={18}
									class="text-slate-400 transition-transform {isStatusDropdownOpen
										? 'rotate-180'
										: ''}"
								/>
							</button>

							{#if isStatusDropdownOpen}
								<div
									role="presentation"
									class="fixed inset-0 z-40"
									onclick={() => (isStatusDropdownOpen = false)}
								></div>

								<div
									class="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden"
								>
									{#each status_options as opt}
										<button
											type="button"
											disabled={opt.isDisabled}
											class="w-full text-left px-5 py-4 transition-colors border-b border-slate-50 last:border-0 font-medium {opt.isDisabled ? 'text-slate-400 cursor-not-allowed bg-slate-100/50' : 'text-slate-700 hover:bg-slate-50/80'} {newStatus === opt.value ? 'bg-slate-50/80 text-[#ad5389]' : ''}"
											onclick={() => {
												if (opt.isDisabled) return;
												newStatus = opt.value;
												if (opt.value === 'bill_upload_required') {
													// No internal form state required
												}
												isStatusDropdownOpen = false;
											}}
										>
											{opt.label}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
					{#if newStatus === 'nach_setup'}
						{@const accountRegex = /^\d{9,18}$/}
						{@const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/}
						{@const accountError = statusFormData.prefBankAccount && !accountRegex.test(statusFormData.prefBankAccount)}
						{@const ifscError = statusFormData.prefIfsc && !ifscRegex.test(statusFormData.prefIfsc.toUpperCase())}
						<div class="animate-in fade-in slide-in-from-top-2 pt-4 space-y-4">
							<div>
								<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
									Borrower Bank Account
								</label>
								<input
									type="text"
									bind:value={statusFormData.prefBankAccount}
									placeholder="Enter Account Number"
									maxlength="18"
									class="w-full p-4 rounded-xl border {accountError ? 'border-red-400 focus:ring-red-400/30' : 'border-slate-200 focus:ring-slate-900'} focus:ring-2 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700"
								/>
								{#if accountError}
									<p class="text-[10px] text-red-500 mt-2 font-medium">Must be 9–18 digits only (no spaces or letters).</p>
								{:else}
									<p class="text-[10px] text-slate-500 mt-2 font-medium">Enter your bank account number (9–18 digits).</p>
								{/if}
							</div>
							<div>
								<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
									Borrower Bank IFSC
								</label>
								<input
									type="text"
									bind:value={statusFormData.prefIfsc}
									placeholder="e.g. SBIN0001234"
									maxlength="11"
									class="w-full p-4 rounded-xl border {ifscError ? 'border-red-400 focus:ring-red-400/30' : 'border-slate-200 focus:ring-slate-900'} focus:ring-2 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700 uppercase tracking-widest"
								/>
								{#if ifscError}
									<p class="text-[10px] text-red-500 mt-2 font-medium">Invalid IFSC. Format: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234).</p>
								{:else}
									<p class="text-[10px] text-slate-500 mt-2 font-medium">11-character RBI IFSC code (e.g. SBIN0001234).</p>
								{/if}
							</div>
						</div>
					{/if}
					
					{#if newStatus === 'kyc_done' || newStatus === 'kyc'}
						<!-- <div class="animate-in fade-in slide-in-from-top-2 pt-4">
							<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
								Loan Amount <span class="text-red-500 ml-1">*</span>
							</label>
							<input
								type="number"
								bind:value={statusFormData.loanAmount}
								placeholder="Enter Loan Amount"
								class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700"
							/>
							<p class="text-[10px] text-slate-500 mt-2 font-medium">Accepts numeric values.</p>
						</div> -->
					{/if}

					
						

					{#if newStatus === 'do_released' || newStatus === 'do_release'}
						<div class="animate-in fade-in slide-in-from-top-2 pt-4">
							
						</div>
					{/if}

					{#if newStatus === 'partial_disbursal' || newStatus === 'partial_disbursed'}
						<div class="animate-in fade-in slide-in-from-top-2 pt-4 space-y-4">
							<!-- <div>
								<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
									UTR Number <span class="text-red-500 ml-1">*</span>
								</label>
								<input
									type="text"
									bind:value={statusFormData.utrNumber}
									placeholder="Enter UTR Number"
									class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700"
								/>
								<p class="text-[10px] text-slate-500 mt-2 font-medium">Accepts alphanumeric RBI reference codes.</p>
							</div> -->
							<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
								POD Number <span class="text-red-500 ml-1">*</span>
							</label>
							<input
								type="text"
								bind:value={statusFormData.podNumber}
								placeholder="Enter POD Number"
								class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700"
							/>
							<p class="text-[10px] text-slate-500 mt-2 font-medium">Accepts alphanumeric values for Proof of Delivery.</p>
							<div>
								<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
									Partial Disbursed Amount <span class="text-red-500 ml-1">*</span>
								</label>
								<input
									type="number"
									bind:value={statusFormData.partialDisbursedAmount}
									placeholder="Enter Amount"
									class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700"
								/>
								<p class="text-[10px] text-slate-500 mt-2 font-medium">Accepts numeric values. Current Limit: {formatAmount(maxAllowedLoanAmount)}</p>
							</div>
						</div>
					{/if}

					{#if newStatus === 'partial_settled'}
						<div class="animate-in fade-in slide-in-from-top-2 pt-4">
							<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
								Borrower UTR Number <span class="text-red-500 ml-1">*</span>
							</label>
							<input
								type="text"
								bind:value={statusFormData.utrNumber}
								placeholder="Enter UTR Number"
								class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700 uppercase tracking-widest"
							/>
							<p class="text-[10px] text-slate-500 mt-2 font-medium">Accepts alphanumeric RBI UTR reference code.</p>
						</div>
					{/if}
					
					{#if newStatus === 'complete_disbursal' || newStatus === 'disbursed'}
						<div class="animate-in fade-in slide-in-from-top-2 pt-4">
							<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
								Final Disbursal Amount <span class="text-red-500 ml-1">*</span>
							</label>
							<input
								type="number"
								bind:value={statusFormData.finalDisbursalAmount}
								placeholder="Enter Amount"
								class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700"
							/>
							<p class="text-[10px] text-slate-500 mt-2 font-medium">Accepts numeric values. Current Limit: {formatAmount(Math.max(0, maxAllowedLoanAmount - computedPartialDisbursedAmount))}</p>
						</div>
					{/if}

					{#if newStatus === 'settled'}
						<div class="animate-in fade-in slide-in-from-top-2 pt-4">
							<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
								 UTR Number <span class="text-red-500 ml-1">*</span>
							</label>
							<input
								type="text"
								bind:value={statusFormData.finalUtrNumber}
								placeholder="Enter Final UTR Number"
								class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 text-slate-700 uppercase tracking-widest"
							/>
							<p class="text-[10px] text-slate-500 mt-2 font-medium">Alphanumeric RBI UTR reference code for final settlement.</p>
						</div>
					{/if}
				</div>
			</div>

			<div
				class="flex items-center justify-around gap-3 p-6 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl"
			>
				<button
					disabled={buttonActive || !newStatus || !isFormValidForStatus}
					class="group flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white hover:bg-white hover:text-[#ad5389] border hover:border-[#ad5389] transition-all cursor-pointer w-full shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => updateStatus(statusEditOrder, newStatus)}
				>
					{#if buttonActive}
						<Loader size={18} class="animate-spin" />
						Updating...
					{:else}
						Update Status
					{/if}
				</button>
			</div>
		</div>
	</div>
{/snippet}

{#snippet popUpFiles()}
	<div
		class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
	>
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex w-md flex-col min-h-[500px] max-h-[90vh]"
		>
			<div class="flex items-center justify-between p-6">
				<div class="flex flex-col">
					<h2 class="text-2xl font-bold text-slate-800">Uploaded Documents</h2>
					<!-- <p class="text-sm text-slate-500 font-mono mt-1">{selected_order_for_files?.orderId}</p> -->
				</div>
				<button
					onclick={() => {
						selected_order_for_files = null;
					}}
					class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
				>
					<X size={24} />
				</button>
			</div>

			<div class="px-8 pb-8 flex-1 overflow-y-auto">
				{#if orderDocuments.length > 0}
					<div class="space-y-4">
						{#each orderDocuments as doc, idx}
							{#if doc.type === 'divider'}
								<div class="relative flex items-center py-2 mt-4 first:mt-0">
									<div class="flex-grow border-t border-slate-300"></div>
									<span class="shrink-0 px-4 text-sm font-bold text-slate-400 tracking-widest uppercase">{doc.name}</span>
									<div class="flex-grow border-t border-slate-300"></div>
								</div>
							{:else if doc.type === 'array'}
								<div class="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
									<div class="flex items-center justify-between border-b border-slate-200 pb-2">
										<span class="font-semibold text-slate-700">{doc.name}</span>
										{#if user?.role?.toLowerCase()?.trim() === 'relationship_manager'}
											<div class="relative">
												<input
													type="file"
													id="reupload-{idx}"
													accept=".pdf,.png,.jpg,.jpeg"
													disabled={replacingDocIndex === idx}
													onchange={(e) => replaceDocument(e, doc, idx)}
													class="hidden"
												/>
												<label
													for="reupload-{idx}"
													class="shrink-0 flex gap-1.5 bg-slate-800 text-white font-medium items-center justify-center py-1.5 px-3 rounded-lg hover:bg-slate-700 transition-all shadow-sm {replacingDocIndex === idx ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
												>
													{#if replacingDocIndex === idx}
														<Loader size={14} class="animate-spin" />
														<span class="text-xs">Uploading...</span>
													{:else}
														<Upload size={14} />
														<span class="text-xs">Replace</span>
													{/if}
												</label>
											</div>
										{/if}
									</div>
									
									{#if doc.files && doc.files.length > 0}
										<div class="flex flex-col gap-2 pt-1 pl-2">
											{#each doc.files as f, fIdx}
												<div class="flex items-center justify-between border-l-2 border-slate-200 pl-4 py-1">
													<div class="flex items-center gap-2">
														<span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
														<span class="text-sm text-slate-600">{f.name}</span>
													</div>
													<button
														onclick={(e) => handleFileClick(e, f.url)}
														class="shrink-0 flex gap-1.5 bg-white text-slate-700 font-medium items-center py-1 px-2.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all shadow-sm"
													>
														<ExternalLink size={14} />
														<span class="text-xs">View</span>
													</button>
												</div>
											{/each}
										</div>
									{:else}
										<div class="text-xs text-slate-400 italic pl-2 pt-1">No files uploaded yet</div>
									{/if}
								</div>
							{:else}
								<div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
									<span class="font-semibold text-slate-700">{doc.name}</span>
									<div class="flex items-center gap-3 shrink-0">
										<button
											onclick={(e) => handleFileClick(e, doc.url)}
											class="shrink-0 flex gap-1.5 bg-white text-slate-700 font-medium items-center justify-center py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all shadow-sm"
										>
											<ExternalLink size={14} />
											<span class="text-xs">View</span>
										</button>
										{#if user?.role?.toLowerCase()?.trim() === 'relationship_manager'}
											<div class="relative">
												<input
													type="file"
													id="reupload-{idx}"
													accept=".pdf,.png,.jpg,.jpeg"
													disabled={replacingDocIndex === idx}
													onchange={(e) => replaceDocument(e, doc, idx)}
													class="hidden"
												/>
												<label
													for="reupload-{idx}"
													class="shrink-0 flex gap-1.5 bg-slate-800 text-white font-medium items-center justify-center py-1.5 px-3 rounded-lg hover:bg-slate-700 transition-all shadow-sm {replacingDocIndex === idx ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
												>
													{#if replacingDocIndex === idx}
														<Loader size={14} class="animate-spin" />
														<span class="text-xs">Uploading...</span>
													{:else}
														<Upload size={14} />
														<span class="text-xs">Replace</span>
													{/if}
												</label>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<div
						class="flex items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-100 mt-4"
					>
						<span class="text-slate-500 font-medium tracking-wide">No documents found</span>
					</div>
				{/if}

				{#if (selected_order_for_files?.actionStatus === 'ADDITIONAL DOCUMENTS REQUIRED' || selected_order_for_files?.doctorActionStatus === 'ADDITIONAL DOCUMENTS REQUIRED' || selected_order_for_files?.lenderActionStatus === 'ADDITIONAL DOCUMENTS REQUIRED' || selected_order_for_files?.actionStatus === 'ADDITIONAL_DOCUMENTS_REQUIRED' || selected_order_for_files?.status === 'ADDITIONAL_DOCUMENTS_REQUIRED' || selected_order_for_files?.status === 'additional_documents_required') && user.role
						?.toLowerCase()
						?.trim() === 'relationship_manager'}
					<div class="mt-8 border-t border-slate-200 pt-6">
						<h3 class="text-lg font-bold text-slate-800 mb-4 tracking-tight">
							Upload Additional Documents
						</h3>
						<input
							type="file"
							multiple
							accept=".pdf,.png,.jpg,.jpeg"
							onchange={(e) => {
								const files = Array.from(e.target.files);
								if (files.length > 10) {
									toast.update(
										'Warning',
										'Maximum 10 files allowed. Extra files were ignored.',
										'failed'
									);
								}
								additionalFiles = files.slice(0, 10);
							}}
							class="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:transition-colors mb-4 focus:outline-none"
						/>
						<button
							disabled={additionalFiles.length === 0 || buttonActive}
							onclick={uploadAdditionalDocs}
							class="w-full shrink-0 flex gap-2 bg-[#ad5389] text-white font-semibold items-center justify-center py-3 px-6 rounded-xl border border-transparent hover:bg-[#8f4170] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
						>
							Upload {additionalFiles.length} File{additionalFiles.length !== 1 ? 's' : ''} (Max 10)
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/snippet}
<!-- {#snippet popupClosure(row)}
	<div class="fixed inset-0 bg-gray-600/40 flex items-center justify-center p-4">
		<div
			class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200"
		>
			<div class="flex items-center justify-between p-6 pb-4">
				<h2 class="text-3xl font-medium text-gray-800">
					Close Order: <span class="font-normal text-gray-700">{row._id}</span>
				</h2>
				<button
					onclick={() => (popupData = null)}
					class="text-gray-400 hover:text-gray-600 cursor-pointer hover:bg-slate-200 p-2 rounded-full"
				>
					<X size={25} />
				</button>
			</div>

			<div class="px-6 py-4 border-t border-gray-100">
				<label class="block text-xl text-gray-800 mb-3">Reason for Closure</label>

				<Select
					options={popup_reasons}
					value={closure_resaon}
					onUpdate={(selected) => (closure_resaon = selected)}
					disabledIf={() => false}
					error=""
					placeholder={'select any reason'}
				/>
			</div>
			{#if closure_description == 'other'}
				<textarea
					bind:value={closure_description}
					rows="4"
					class="input-style resize-none"
					placeholder={item.placeholder}
				/>
			{/if}

			<div class="flex justify-end gap-4 p-6 border-t border-gray-100 mt-4">
				<button
					class="px-8 py-4 bg-[#cd5c52] text-white font-semibold rounded-lg hover:bg-[#b85049] text-xl transition-colors"
				>
					Submit
				</button>
			</div>
		</div>
	</div>
{/snippet} -->

{#snippet noResults()}
	<div
		class="bg-slate-50 flex items-center justify-center w-full p-6 shadow-inner gap-6 rounded-b-2xl"
	>
		<h1 class="text-slate-400">No results found</h1>
	</div>
{/snippet}

{#snippet Pagination({ currentPage, hasNextPage, onPageChange })}
	<div class="w-full flex justify-center py-10">
		<div
			class="flex items-center bg-white border border-slate-200 rounded-full shadow-sm px-2 py-1"
		>
			<div class="min-w-[70px] flex justify-center">
				{#if currentPage > 1}
					<button
						onclick={() => {
							if (currentPage - 1 == 0) {
								return;
							}

							onPageChange(currentPage - 1);
						}}
						class="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#ad5389] transition-all cursor-pointer active:scale-90"
					>
						Prev
					</button>
				{:else}
					<div class="px-3 py-2 opacity-0">Prev</div>
				{/if}
			</div>

			<div class="h-4 w-[1px] bg-slate-100"></div>

			<div class="flex items-center gap-2 px-6">
				<!-- <span class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pg</span> -->
				<span class="text-sm font-bold text-slate-800">{currentPage}</span>
			</div>

			<div class="h-4 w-[1px] bg-slate-100"></div>

			<div class="min-w-[70px] flex justify-center">
				{#if hasNextPage}
					<button
						onclick={() => {
							let newpage = currentPage + 1;
							onPageChange(newpage);
						}}
						class="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#ad5389] transition-all cursor-pointer active:scale-90"
					>
						Next
					</button>
				{:else}
					<div class="px-3 py-2 opacity-0">Next</div>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet popUpRejection()}
	<div
		class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
	>
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex w-md flex-col min-h-[500px]"
		>
			<div class="flex items-center justify-between p-6">
				<div class="flex flex-col">
					<h2 class="text-2xl font-bold text-slate-800">Reject Order</h2>
					<p class="text-sm text-slate-500 font-mono mt-1">{rejection_order?._id}</p>
				</div>
				<button
					onclick={() => {
						rejection_order = null;
						rejection_reason = '';
					}}
					class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
				>
					<X size={24} />
				</button>
			</div>

			<div class="px-8 pb-8 flex-1" class:disabled-style={buttonActive}>
				<div class="space-y-6">
					<div class="animate-in fade-in slide-in-from-top-2">
						<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
							reason
						</label>
						<textarea
							bind:value={rejection_reason}
							rows="4"
							class="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none bg-slate-50"
							placeholder="Please provide more information..."
						></textarea>
					</div>
				</div>
			</div>

			<div
				class="flex items-center justify-around gap-3 p-6 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl"
			>
				<button
					disabled={buttonActive}
					class="group mt-10 mb-10 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white hover:bg-white hover:text-[#ad5389] border hover:border-[#ad5389] transition-all cursor-pointer w-full shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleReject(rejection_order, rejection_reason)}
				>
					{#if buttonActive}
						<Loader size={18} class="animate-spin" />
						Rejecting...
					{:else}
						Reject
					{/if}
				</button>
			</div>
		</div>
	</div>
{/snippet}

	{#if rmUploadOrder}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			role="presentation"
			class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
		>
			<div
				class="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 flex flex-col"
			>
				<div class="flex items-center justify-between p-6">
					<div class="flex flex-col">
						<h2 class="text-2xl font-bold text-slate-800">Upload RM Documents</h2>
						<p class="text-sm text-slate-500 font-mono mt-1">{rmUploadOrder?.orderId}</p>
					</div>
					<button
						onclick={() => {
							rmUploadOrder = null;
							rmUploadFormData = { cancelledCheque: null, finalBill: null };
						}}
						class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				<div class="px-8 pb-8 flex-1" class:disabled-style={buttonActive}>
					<div class="space-y-6">

						{#if rmUploadOrder?.borrower_bank_account || rmUploadOrder?.borrower_bank_ifsc}
							<div class="rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-100">
								{#if rmUploadOrder?.borrower_bank_account}
									<div class="flex items-center justify-between px-4 py-3">
										<span class="text-xs font-bold text-slate-500 uppercase tracking-wide">Bank Account</span>
										<span class="text-sm font-semibold text-slate-800 font-mono tracking-wider">{rmUploadOrder.borrower_bank_account}</span>
									</div>
								{/if}
								{#if rmUploadOrder?.borrower_bank_ifsc}
									<div class="flex items-center justify-between px-4 py-3">
										<span class="text-xs font-bold text-slate-500 uppercase tracking-wide">IFSC Code</span>
										<span class="text-sm font-semibold text-slate-800 font-mono uppercase tracking-widest">{rmUploadOrder.borrower_bank_ifsc}</span>
									</div>
								{/if}
							</div>
						{/if}

						{#if !rmUploadOrder?.documents?.lenderDoc?.cancelledCheque}
							<div>
								<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
									Cancelled Borrower Cheque <span class="text-red-500 ml-1">*</span>
								</label>
								<input
									type="file"
									accept=".pdf, .jpg, .jpeg, .png"
									bind:files={rmUploadFormData.cancelledCheque}
									class="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:transition-colors focus:outline-none bg-slate-50 border border-slate-200 rounded-xl p-2 transition-all"
								/>
							</div>
						{/if}
						<div>
							<label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
								Final Bill <span class="text-red-500 ml-1">*</span>
							</label>
							<input
								type="file"
								accept=".pdf, .jpg, .jpeg, .png"
								bind:files={rmUploadFormData.finalBill}
								class="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:transition-colors focus:outline-none bg-slate-50 border border-slate-200 rounded-xl p-2 transition-all"
							/>
						</div>
					</div>
					<button
						disabled={(!rmUploadFormData.cancelledCheque && !rmUploadOrder?.documents?.lenderDoc?.cancelledCheque) || !rmUploadFormData.finalBill}
						class="w-full mt-6 flex gap-3 bg-slate-900 hover:bg-[#ad5389] font-bold items-center justify-center py-4 px-6 text-white rounded-xl border border-transparent transition-all disabled:pointer-events-none disabled:opacity-50 shadow-lg"
						onclick={submitRmUpload}
					>
						<span>Upload Files</span>
						<Upload size={18} />
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if billVerifyOrder}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			role="presentation"
			class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
		>
			<div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh]">
				<!-- Header -->
				<div class="flex items-center justify-between p-6 border-b border-slate-100">
					<div class="flex flex-col">
						<h2 class="text-2xl font-bold text-slate-800">Verify Uploaded Bill</h2>
						<p class="text-sm text-slate-500 font-mono mt-1">{billVerifyOrder?.orderId}</p>
					</div>
					<button
						onclick={() => { billVerifyOrder = null; }}
						class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				<!-- Documents list -->
				<div class="px-8 py-6 flex-1 overflow-y-auto space-y-3">
					{#if billDocs.length > 0}
						{#each billDocs as doc}
							<div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
								<span class="font-semibold text-slate-700">{doc.name}</span>
								<button
									onclick={(e) => handleFileClick(e, doc.url)}
									class="shrink-0 flex gap-1.5 bg-white text-slate-700 font-medium items-center justify-center py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all shadow-sm"
								>
									<ExternalLink size={14} />
									<span class="text-xs">View</span>
								</button>
							</div>
						{/each}
					{:else}
						<p class="text-slate-400 text-sm italic text-center py-8">No documents found for this order.</p>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-3 p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
					<button
						disabled={buttonActive}
						onclick={async () => {
							await updateStatus(billVerifyOrder, 'bill_verified');
							billVerifyOrder = null;
						}}
						class="flex-1 flex gap-2 items-center justify-center py-4 px-6 rounded-xl bg-slate-900 hover:bg-white hover:text-[#ad5389] hover:border-[#ad5389] text-white font-bold border border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg group/verify"
					>
						{#if buttonActive}
							<Loader size={16} class="animate-spin" />
							<span>Verifying...</span>
						{:else}
							<CheckCircle size={16} class="group-hover/verify:scale-110 transition-transform" />
							<span>Verify Bill</span>
						{/if}
					</button>
					<button
						disabled={buttonActive}
						onclick={() => {
							rejection_order = billVerifyOrder;
							billVerifyOrder = null;
						}}
						class="flex-1 flex gap-2 items-center justify-center py-4 px-6 rounded-xl bg-white text-slate-500 hover:text-red-600 hover:border-red-400 font-bold border border-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/reject"
					>
						<XCircle size={16} class="group-hover/reject:rotate-90 transition-transform duration-300" />
						<span>Reject Bill</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

<style>
	@reference "tailwindcss";
	.disabled-style {
		@apply !text-slate-300 !bg-slate-50/50 !border-slate-200 cursor-not-allowed;
	}
</style>
