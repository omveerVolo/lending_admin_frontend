
export function validate_ifPreAuthEmpty(items, formData) {
    const error = {};

    items.forEach((item) => {

        if (item.required) {
            const value = formData[item.name];


            const isEmpty =
                value === undefined ||
                value === null ||
                value === 'null' ||
                (typeof value === 'string' && value.trim() === '') ||
                (typeof value === 'number' && isNaN(value));

            if (isEmpty) {

                error[item.name] = `${item.label} is required`;
            }
        }
    });

    return error;
}