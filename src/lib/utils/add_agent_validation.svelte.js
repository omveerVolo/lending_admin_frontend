export function validate_ifAgentFormEmpty(items, formData) {
    const error = {};

    items.forEach((item) => {
        // Only validate fields that are marked as required
        if (item.required) {
            const value = formData[item.name];

            // Define what "empty" means for your specific field types
            const isEmpty =
                value === undefined ||
                value === null ||
                value === 'null' ||
                (typeof value === 'string' && value.trim() === '');

            if (isEmpty) {
                error[item.name] = `${item.label} is required`;
            }
        }
    });

    return error;
}