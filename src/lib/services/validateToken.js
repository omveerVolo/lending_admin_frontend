import { PUBLIC_API_BASE_URL } from "$env/static/public"
import { user } from "$lib/state/role_and_permission.svelte";

export async function validateToken() {
    console.log("validate Token at Route running")
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
        const res = await fetch(`${PUBLIC_API_BASE_URL}/`, {
            credentials: "include",
            method: "GET",
            signal: controller.signal
        })

        clearTimeout(timeoutId);

        let data = await res.json();
        user.set_role({ value: data.role })

        return res.ok
    } catch (e) {
        clearTimeout(timeoutId);
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Token validation failed:", errorMessage);
        return false
    }
}