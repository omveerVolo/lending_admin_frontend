import { PUBLIC_API_BASE_URL } from "$env/static/public"
import { user } from "$lib/state/role_and_permission.svelte";

export async function validateToken() {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
        const res = await fetch(`https://backend.finnova.health//auth/verify-token`, {
            credentials: "include",
            method: "GET",
            signal: controller.signal
        })

        clearTimeout(timeoutId);

        if (!res.ok) {

            return false;
        }

        try {
            let data = await res.json();
            localStorage.setItem("card_emi_enabled", data.card_emi_enabled);
            localStorage.setItem("reimbursement_enabled", data.reimbursement_enabled);
            localStorage.setItem("lending_enabled", data.lending_enabled);
            localStorage.setItem("zype_lending_enabled", data.zype_lending_enabled);
            localStorage.setItem("zypePriority", data.zypePriority);
            localStorage.setItem("fibePriority", data.fibePriority);
            localStorage.setItem("fibeReimbursementPriority", data.fibeReimbursementPriority);
            localStorage.setItem("iflReimbursementPriority", data.iflReimbursementPriority);
            // Explicitly handle the expired/deleted token scenario expected from the backend
            if (data && data.authenticated === false) {

                return false;
            }

            if (data && data.role) {
                user.set_role({ value: data.role });
                return true;
            } else {

                // We return ok here depending on exact previous behavior
                return res.ok;
            }
        } catch (jsonErr) {

            return false;
        }

    } catch (e) {
        clearTimeout(timeoutId);
        const errorMessage = e instanceof Error ? e.message : String(e);

        return false
    }
}