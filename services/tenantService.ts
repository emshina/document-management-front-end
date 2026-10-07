import { apiCall } from '@/lib/api';

export interface Tenant {
  id: string;
  name: string;
  parent?: string | null;
  children?: Tenant[];
}

/**
 * Fetches all accessible tenants/companies for the current user.
 */
export async function fetchUserTenants(): Promise<Tenant[]> {
  try {
    const data = await apiCall('/v1/tenants/', {
      requiresAuth: true,
    });
    return data.results || data;
  } catch (error) {
    console.error('Failed to fetch user tenants:', error);
    return [];
  }
}

/**
 * Ensures a valid active tenant ID exists in localStorage.
 * If missing or invalid, it fetches the user's tenants and defaults to the first available one.
 */
export async function getValidActiveTenantId(): Promise<string> {
  const activeId = localStorage.getItem('active_company_id') || localStorage.getItem('tenant_id');

  if (activeId && activeId !== 'null' && activeId !== 'undefined' && activeId.trim() !== '') {
    return activeId.trim();
  }

  // Fallback: fetch valid tenants from the backend and pick the first one
  const tenants = await fetchUserTenants();
  if (tenants.length > 0) {
    const defaultId = tenants[0].id;
    localStorage.setItem('active_company_id', defaultId);
    return defaultId;
  }

  return '';
}