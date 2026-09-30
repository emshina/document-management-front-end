import { apiCall } from '@/lib/api';

export interface Employee {
  id: string;
  staff_no?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  department_name?: string;
  position_id?: string;
  position_title?: string;
  status: string;
  contract_type: string;
  contract_expiry?: string;
  tenant_id?: string;
  [key: string]: any;
}

/**
 * Fetches all employees from the enterprise registry.
 * Handles both paginated (DRF results array) and non-paginated responses.
 */
export async function fetchAllEmployees(): Promise<Employee[]> {
  try {
    const response = await apiCall('/v1/hr/employees/', {
      requiresAuth: true,
      method: 'GET',
    });

    return Array.isArray(response) ? response : response?.results || [];
  } catch (error) {
    console.error('Failed to fetch employees list:', error);
    throw error;
  }
}