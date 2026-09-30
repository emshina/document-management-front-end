import { apiCall } from '@/lib/api';

export interface Department {
  id: string;
  name: string;
  tenant_id?: string;
  registry_folder?: string | null;
  [key: string]: any;
}

/**
 * Fetches all departments available in the current tenant scope.
 * Handles both paginated arrays and direct response lists.
 */
export async function fetchDepartments(): Promise<Department[]> {
  try {
    const response = await apiCall('/v1/hr/departments/', {
      requiresAuth: true,
      method: 'GET',
    });

    return Array.isArray(response) ? response : response?.results || [];
  } catch (error) {
    console.error('Failed to fetch departments list:', error);
    throw error;
  }
}

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