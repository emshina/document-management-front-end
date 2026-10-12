// C:\Users\allan.muyesu\Desktop\my-app\lib\auth.ts

export function setAuthToken(token: string) {
  // Store token in localStorage for client-side API calls
  localStorage.setItem('access_token', token);

  // Store token in cookies for Middleware/Proxy server-side route checks
  document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAuthToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('tenant_id');
  localStorage.removeItem('user_permissions');
  
  // Clear cookie on logout
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
}