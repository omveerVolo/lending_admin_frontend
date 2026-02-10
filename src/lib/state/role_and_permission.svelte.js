
export let user = $state({
    role: "",
    set_role({ value }) { this.role = value },
    clear_roles() { this.role = "" }
});