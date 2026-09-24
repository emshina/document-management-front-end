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
    // Robust token resolution matching your app's localStorage keys
    let token = 
      localStorage.getItem('access_token') || 
      localStorage.getItem('access') || 
      localStorage.getItem('token');

    // Fallback search if keys are structured unusually or concatenated in storage
    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('access_token') || key === 'access')) {
          if (key.length > 25) {
            token = key.replace(/^access_token/, '');
          } else {
            token = localStorage.getItem(key);
          }
          break;
        }
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    // Automatically inject tenant context using active_company_id or tenant_id
    const tenantId = 
      localStorage.getItem('active_company_id') || 
      localStorage.getItem('tenant_id');
      
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId.trim(); 
    }
  }

  // ✅ ROBUST URL RESOLUTION:
  // If Django pagination returns an absolute URL (e.g., http://localhost:8000/api/v1/...),
  // extract just the pathname and search parameters so we don't duplicate the base URL.
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

  // ✅ Safely combine base URL and endpoint, handling any missing or duplicate slashes
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