import { PUBLIC_API_BASE_URL } from "$env/static/public"
import { user } from "$lib/state/role_and_permission.svelte";

export async function validateToken() {
    console.log("validate Token at Route running")
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
        const res = await fetch(`${PUBLIC_API_BASE_URL}/auth/verify-token`, {
            credentials: "include",
            method: "GET",
            signal: controller.signal
        })

        clearTimeout(timeoutId);
        console.log(res)
        console.log(`[Token Check] HTTP Status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
            console.error(`[Token Check] Failed. Backend says: ${res.status}`);
            return false;
        }

        try {
            let data = await res.json();
            console.log("[Token Check] Payload:", data);

            // Explicitly handle the expired/deleted token scenario expected from the backend
            if (data && data.authenticated === false) {
                console.warn("[Token Check] Backend explicitly reported authenticated: false");
                return false;
            }

            if (data && data.role) {
                user.set_role({ value: data.role });
                return true;
            } else {
                console.warn("[Token Check] Missing 'role' in JSON payload, but status was OK.");
                // We return ok here depending on exact previous behavior
                return res.ok;
            }
        } catch (jsonErr) {
            console.error("[Token Check] Failed to parse JSON from /auth/verify-token");
            return false;
        }

    } catch (e) {
        clearTimeout(timeoutId);
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`[Token Check] Network or timeout error: ${errorMessage}`);
        return false
    }
}