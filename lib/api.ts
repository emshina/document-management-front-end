import { EmployeePopupData } from "@/services/folderService";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
  _isRetry?: boolean; // Internal flag to prevent infinite refresh loops
}

/**
 * Clear authentication/session data.
 */
function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("access_token");
  localStorage.removeItem("access");
  localStorage.removeItem("token");

  localStorage.removeItem("refresh_token");
  localStorage.removeItem("refresh");

  localStorage.removeItem("active_company_id");
  localStorage.removeItem("tenant_id");
}

/**
 * Redirect the user to login when their authentication
 * is no longer valid.
 */
function handleUnauthorized() {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;

  // Do not redirect public pages.
  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify-email";

  if (isPublicPage) {
    return;
  }

  clearAuthSession();

  // Avoid redirecting repeatedly if already on login.
  if (!pathname.startsWith("/login")) {
    window.location.replace("/login?session_expired=true");
  }
}

export async function apiCall(
  endpoint: string,
  options: FetchOptions = {}
) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set application/json when the body is NOT FormData.
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options.requiresAuth) {
    let token: string | null = null;
    let tenantId: string | null = null;

    // 1. Direct standard token lookups.
    token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("access") ||
      localStorage.getItem("token");

    // 2. Prioritize explicitly supplied tenant header.
    const explicitHeaderTenant =
      headers["X-Tenant-ID"] || headers["x-tenant-id"];

    if (explicitHeaderTenant) {
      tenantId = explicitHeaderTenant;
    } else {
      // 3. Fallback to active company / tenant.
      tenantId =
        localStorage.getItem("active_company_id") ||
        localStorage.getItem("tenant_id");
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token.trim()}`;
    }

    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId.trim();
    }
  }

  // Robust URL resolution.
  let targetEndpoint = endpoint;

  if (
    endpoint.startsWith("http://") ||
    endpoint.startsWith("https://")
  ) {
    try {
      const parsedUrl = new URL(endpoint);
      targetEndpoint = parsedUrl.pathname + parsedUrl.search;
    } catch (e) {
      // Keep original endpoint if parsing fails.
    }
  }

  // Prevent double-prefixing /api.
  if (
    targetEndpoint.startsWith("/api/") ||
    targetEndpoint === "/api"
  ) {
    targetEndpoint = targetEndpoint.replace(/^\/api/, "");
  }

  // Safely combine base URL and endpoint.
  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  const cleanEndpoint = targetEndpoint.startsWith("/")
    ? targetEndpoint
    : `/${targetEndpoint}`;

  const requestUrl = `${cleanBase}${cleanEndpoint}`;

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  /**
   * AUTOMATIC TOKEN REFRESH ON 401
   */
  if (response.status === 401 && options.requiresAuth) {
    // If we haven't tried retrying yet, attempt to refresh the token
    if (!options._isRetry) {
      options._isRetry = true;

      const refreshToken =
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("refresh");

      if (refreshToken) {
        try {
          // Call the SimpleJWT refresh endpoint directly
          const refreshResponse = await fetch(`${cleanBase}/token/refresh/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            const newAccessToken = data.access;
            const newRefreshToken = data.refresh; // Provided because ROTATE_REFRESH_TOKENS is True

            if (newAccessToken) {
              localStorage.setItem("access_token", newAccessToken);
            }
            if (newRefreshToken) {
              localStorage.setItem("refresh_token", newRefreshToken);
            }

            // Retry the original API call with the same options
            return apiCall(endpoint, options);
          }
        } catch (refreshError) {
          // Refresh request failed network/parsing-wise, fall through to logout
        }
      }
    }

    // If refresh token is missing, expired, or rotation failed, force logout
    handleUnauthorized();

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  if (!response.ok) {
    const rawErrorText = await response.text();

    let errorMessage = "Something went wrong with the request.";

    try {
      const errorJson = JSON.parse(rawErrorText);

      errorMessage =
        errorJson.detail ||
        errorJson.message ||
        errorJson.error ||
        JSON.stringify(errorJson);
    } catch {
      errorMessage = rawErrorText.includes("<!DOCTYPE html>")
        ? `Server Error (${response.status}): Check your Django terminal for the full Python traceback.`
        : rawErrorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Helper function to resolve absolute API URLs.
export function getApiUrl(endpoint: string) {
  let targetEndpoint = endpoint;

  if (
    endpoint.startsWith("http://") ||
    endpoint.startsWith("https://")
  ) {
    try {
      const parsedUrl = new URL(endpoint);
      targetEndpoint = parsedUrl.pathname + parsedUrl.search;
    } catch (e) {
      // Keep original endpoint if URL parsing fails.
    }
  }

  if (
    targetEndpoint.startsWith("/api/") ||
    targetEndpoint === "/api"
  ) {
    targetEndpoint = targetEndpoint.replace(/^\/api/, "");
  }

  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  const cleanEndpoint = targetEndpoint.startsWith("/")
    ? targetEndpoint
    : `/${targetEndpoint}`;

  return `${cleanBase}${cleanEndpoint}`;
}

// Employee creation helper function.
export async function createEmployee(employeeData: any) {
  return apiCall("/v1/hr/employees/", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(employeeData),
  });
}