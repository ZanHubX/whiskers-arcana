const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    "https://whispers-backend-nyko.onrender.com/api"
).replace(/\/+$/, "");


const TOKEN_KEY = "wwa_admin_token";
const USER_KEY = "wwa_admin_user";

export type AdminUser = {
    id: number;
    name: string;
    email: string;
};

export type PaymentMethod = {
    id: number;
    name: string;
    account_name: string | null;
    account_number: string | null;
    instructions: string | null;
    qr_code_path: string | null;
    qr_code_url?: string | null;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
};

type LoginResponse = {
    message: string;
    token: string;
    user: AdminUser;
};

function getApiUrl(endpoint: string): string {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${path}`;
}

export function getAdminToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser(): AdminUser | null {
    const value = localStorage.getItem(USER_KEY);

    if (!value) return null;

    try {
        return JSON.parse(value) as AdminUser;
    } catch {
        localStorage.removeItem(USER_KEY);
        return null;
    }
}

function clearAdminSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

async function getErrorMessage(response: Response): Promise<string> {
    const contentType = response.headers.get("Content-Type") || "";
    let data: any = {};

    if (contentType.includes("application/json")) {
        data = await response.json().catch(() => ({}));
    } else {
        const responseText = await response.text().catch(() => "");

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch {
                data.message = responseText.slice(0, 250);
            }
        }
    }

    if (data?.errors && typeof data.errors === "object") {
        const firstError = Object.values(data.errors)
            .flat()
            .find((value) => typeof value === "string");

        if (firstError) return firstError as string;
    }

    if (data?.message) {
        return String(data.message);
    }

    if (response.status === 401) {
        return "Your session has expired. Please log in again.";
    }

    if (response.status === 403) {
        return "You do not have permission to perform this action.";
    }

    if (response.status === 404) {
        return "The requested API route or record was not found.";
    }

    return `Request failed (${response.status}).`;
}

/**
 * Authenticated JSON API request.
 * Supports JSON bodies and FormData uploads.
 */
export async function adminRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAdminToken();
    const headers = new Headers(options.headers);

    headers.set("Accept", "application/json");

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(getApiUrl(endpoint), {
        ...options,
        headers,
        cache: "no-store",
    });

    if (!response.ok) {
        if (response.status === 401) {
            clearAdminSession();
        }

        throw new Error(await getErrorMessage(response));
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get("Content-Type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error(
            `Expected JSON from ${endpoint}, but received ${contentType || "an unknown content type"
            }.`
        );
    }

    return (await response.json()) as T;
}

/**
 * Fetch a private payment receipt using the admin Bearer token.
 * Do not put the protected API URL directly in an img src.
 */
export async function adminRequestBlob(
    endpoint: string
): Promise<Blob> {
    const token = getAdminToken();

    if (!token) {
        throw new Error("Admin session missing. Please log in again.");
    }

    const response = await fetch(getApiUrl(endpoint), {
        method: "GET",
        headers: {
            Accept: "image/jpeg, image/png, image/webp",
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        if (response.status === 401) {
            clearAdminSession();
        }

        throw new Error(await getErrorMessage(response));
    }

    const contentType = (
        response.headers.get("Content-Type") || ""
    )
        .split(";")[0]
        .trim()
        .toLowerCase();

    const allowedTypes = new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
    ]);

    if (!allowedTypes.has(contentType)) {
        const body = await response.text().catch(() => "");

        throw new Error(
            `Receipt API returned "${contentType || "unknown"}" instead of an image. ` +
            body.slice(0, 200)
        );
    }

    const blob = await response.blob();

    if (blob.size === 0) {
        throw new Error("The receipt image response is empty.");
    }

    if (blob.type && !blob.type.toLowerCase().startsWith("image/")) {
        throw new Error(
            `Invalid receipt Blob type: ${blob.type}`
        );
    }

    return blob.slice(0, blob.size, contentType);
}

/**
 * Admin login.
 */
export async function adminLogin(
    email: string,
    password: string
): Promise<AdminUser> {
    const response = await fetch(getApiUrl("/admin/login"), {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    const result = (await response.json()) as LoginResponse;

    if (!result.token || !result.user) {
        throw new Error("The server returned an invalid login response.");
    }

    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));

    return result.user;
}

/**
 * Verify the current admin session.
 */
export async function verifyAdminSession(): Promise<AdminUser> {
    if (!getAdminToken()) {
        throw new Error("No admin session found.");
    }

    const data = await adminRequest<{ user: AdminUser }>("/admin/me");

    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return data.user;
}

/**
 * Admin logout.
 */
export async function adminLogout(): Promise<void> {
    try {
        if (getAdminToken()) {
            await adminRequest<{ message: string }>("/admin/logout", {
                method: "POST",
            });
        }
    } finally {
        clearAdminSession();
    }
}
