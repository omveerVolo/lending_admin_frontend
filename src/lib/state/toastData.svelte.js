export const toast = $state({
    title: "",
    message: "",
    status: "",
    update(title, message, status) {
        this.message = message;
        this.status = status;
        this.title = title
    },

    clear() {
        this.title = "";
        this.status = "";
        this.message = "";
    }
})