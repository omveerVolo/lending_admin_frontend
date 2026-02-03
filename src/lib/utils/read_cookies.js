export default function readCookie(name) {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (name == key) {
            return decodeURIComponent(value);
        }
    }
    return null
}