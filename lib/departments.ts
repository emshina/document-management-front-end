import { apiCall } from '@/lib/api';

export interface Department {
  id: string;
  name: string;
  tenant_id?: string;
  registry_folder?: string | null;
  [key: string]: any;
}

/**
 * Fetches departments explicitly scoped to a target tenant/mother company ID.
 */
export async function fetchDepartments(tenantId?: string): Promise<Department[]> {
  try {
    const headers: Record<string, string> = {};
    
    // Fallback or safety check: if tenantId is missing, log a warning
    if (!tenantId) {
      console.warn("fetchDepartments called without a tenantId! Expecting empty results.");
    } else {
      headers['X-Tenant-ID'] = tenantId;
    }

    // Pass tenant_id as a query parameter as well, matching backend support
    const endpoint = tenantId 
      ? `/v1/hr/departments/?tenant_id=${tenantId}` 
      : '/v1/hr/departments/';

    const response = await apiCall(endpoint, {
      requiresAuth: true,
      method: 'GET',
      headers,
    });

    return Array.isArray(response) ? response : response?.results || [];
  } catch (error) {
    console.error('Failed to fetch departments list:', error);
    throw error;
  }
}

// Keep an alias export
export const fetchDepartmentsByTenant = fetchDepartments;

/**
 * Fetches all documents inside a specific department's registry folder.
 */
export async function fetchDepartmentFolderDocuments(departmentId: string): Promise<any[]> {
  try {
    const response = await apiCall(`/v1/hr/departments/${departmentId}/folder_documents/`, {
      requiresAuth: true,
      method: 'GET',
    });

    return Array.isArray(response) ? response : response?.results || [];
  } catch (error) {
    console.error(`Failed to fetch documents for department ${departmentId}:`, error);
    throw error;
  }
}