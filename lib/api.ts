import { EmployeePopupData } from "@/services/folderService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiCall(endpoint: string, options: FetchOptions = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set 'application/json' if the body is NOT FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.requiresAuth) {
    let token: string | null = null;
    let tenantId: string | null = null;

    // 1. Direct standard lookups
    token = 
      localStorage.getItem('access_token') || 
      localStorage.getItem('access') || 
      localStorage.getItem('token');

    tenantId = 
      localStorage.getItem('active_company_id') || 
      localStorage.getItem('tenant_id');

    // 2. Fallback deep-scan across all localStorage items & values
    if (!token || !tenantId) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || '';
        const combinedBlob = `${key} ${val}`;

        // Hunt down JWT token pattern (starts with eyJ...)
        if (!token) {
          const jwtMatch = combinedBlob.match(/(eyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+)/);
          if (jwtMatch) {
            token = jwtMatch[1];
          }
        }

        // Hunt down Tenant UUID pattern
        if (!tenantId) {
          const uuidMatch = combinedBlob.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
          if (uuidMatch) {
            tenantId = uuidMatch[1];
          }
        }
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId.trim();
    }
  }

  // ✅ ROBUST URL RESOLUTION:
  let targetEndpoint = endpoint;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    try {
      const parsedUrl = new URL(endpoint);
      targetEndpoint = parsedUrl.pathname + parsedUrl.search;
    } catch (e) {
      // Fallback if parsing fails
    }
  }

  // 🛠️ Prevent double-prefixing if endpoint starts with /api/ or /api
  if (targetEndpoint.startsWith('/api/') || targetEndpoint === '/api') {
    targetEndpoint = targetEndpoint.replace(/^\/api/, '');
  }

  // ✅ Safely combine base URL and endpoint
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = targetEndpoint.startsWith('/') ? targetEndpoint : `/${targetEndpoint}`;
  const requestUrl = `${cleanBase}${cleanEndpoint}`;

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const rawErrorText = await response.text();
    let errorMessage = 'Something went wrong with the request.';
    
    try {
      const errorJson = JSON.parse(rawErrorText);
      errorMessage = errorJson.detail || JSON.stringify(errorJson);
    } catch {
      errorMessage = rawErrorText.includes('<!DOCTYPE html>') 
        ? `Server Error (${response.status}): Check your Django terminal for the full Python traceback.` 
        : rawErrorText;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;

  return response.json();
}

// Helper function to resolve absolute API URLs
export function getApiUrl(endpoint: string) {
  let targetEndpoint = endpoint;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    try {
      const parsedUrl = new URL(endpoint);
      targetEndpoint = parsedUrl.pathname + parsedUrl.search;
    } catch (e) {
      // Fallback
    }
  }

  if (targetEndpoint.startsWith('/api/') || targetEndpoint === '/api') {
    targetEndpoint = targetEndpoint.replace(/^\/api/, '');
  }

  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = targetEndpoint.startsWith('/') ? targetEndpoint : `/${targetEndpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

// Employee creation helper function
export async function createEmployee(employeeData: any) {
  return apiCall('/v1/hr/employees/', {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify(employeeData),
  });
}