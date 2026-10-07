import { apiCall } from '@/lib/api';

export interface TenantBranding {
  id?: string;
  name: string;
  effective_logo?: string;
  effective_primary_color?: string;
}

/**
 * Fetches current tenant branding data including ID, name, logo, and primary color.
 * Automatically syncs the tenant ID to localStorage for global API requests.
 * Falls back to a default primary color (#2D1B4E) if not defined.
 */
export async function fetchTenantBranding(): Promise<TenantBranding> {
  const defaultBranding: TenantBranding = {
    name: 'Visaro Server',
    effective_primary_color: '#2D1B4E',
  };

  try {
    const data = await apiCall('/v1/tenants/tenants/current/', { requiresAuth: true });
    if (!data) return defaultBranding;

    const tenantObj = Array.isArray(data) ? data[0] : data.results?.[0] || data;
    const tenantId = tenantObj?.id;

    // Automatically cache the tenant ID in localStorage for downstream requests
    if (tenantId && typeof window !== 'undefined') {
      localStorage.setItem('active_company_id', String(tenantId));
    }

    return {
      id: tenantId,
      name: tenantObj?.name || defaultBranding.name,
      effective_logo: tenantObj?.effective_logo,
      effective_primary_color: tenantObj?.effective_primary_color || defaultBranding.effective_primary_color,
    };
  } catch (err) {
    console.error('Error fetching tenant branding:', err);
    return defaultBranding;
  }
}

/**
 * Helper to resolve relative or absolute logo URLs safely.
 */
export function getLogoUrl(logoPath?: string): string {
  if (!logoPath) return '';
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const backendRoot = apiBase ? apiBase.replace(/\/api\/?$/, '') : window.location.origin;
  return `${backendRoot}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
}