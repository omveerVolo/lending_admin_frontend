export function validate_ifEmpty(items, formData, MID) {
    const error = {};
    // Aligning keys with your actual formData names
    const onboardingKeys = [
        'onboardedFibe',
        'onboardedPayU',
        'onboardedRazorPay',
        'onboardedEmfyn/zype'
    ];

    // 1. Logic for Parent Hospital vs Onboarding Partners
    if (MID) {
        const isAnyOnboarded = onboardingKeys.some(key => formData[key] === true);
        const hospitalValue = formData['parent'];
        const isHospitalEmpty = !hospitalValue || hospitalValue === 'null' || hospitalValue === '';

        // Only trigger this if both are empty
        if (isHospitalEmpty && !isAnyOnboarded) {
            error['parent'] = 'Please select a Parent Hospital or an Onboarding Partner';
            onboardingKeys.forEach(key => {
                error[key] = 'Required if no Parent Hospital selected';
            });
        }
    }


    items.forEach((item) => {
        // Rule A: If required is explicitly false, skip validation entirely
        if (item.required === false) {
            return;
        }

        // Rule B: Skip fields handled by the special logic in Step 1
        if (item.name === 'parent' || onboardingKeys.includes(item.name)) {
            return;
        }

        // Rule C: Standard required check
        if (item.required) {
            const value = formData[item.name];

            const isEmpty =
                value === undefined ||
                value === null ||
                value === 'null' ||
                (typeof value === 'string' && value.trim() === '') ||
                (item.type === 'file' && !(value instanceof File));

            if (isEmpty) {
                error[item.name] = `${item.label} is required`;
            }
        }
    });

    return error;
}