const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    const token = localStorage.getItem('access_token') || localStorage.getItem('access');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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