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
 * Exported as `fetchDepartments` to match your page imports.
 */
export async function fetchDepartments(tenantId?: string): Promise<Department[]> {
  try {
    const headers: Record<string, string> = {};
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    const response = await apiCall('/v1/hr/departments/', {
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

// Keep an alias export just in case other files use this name
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