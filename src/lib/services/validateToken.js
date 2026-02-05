import { PUBLIC_BASE_URL } from "$env/static/public"
import { user } from "$lib/state/role_and_permission.svelte";

export async function validateToken() {
    console.log("validate Token at Route running")
    try {
        const res = await fetch(`${PUBLIC_BASE_URL}/`, {
            credentials: "include",
            method: "GET",
        })

        let data = await res.json();
        // console.log(data)
        user.set_role({ value: data.role })

        return res.ok
    } catch {
        return false
    }


}