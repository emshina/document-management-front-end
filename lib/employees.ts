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
 * Automatically loops through paginated pages if DRF pagination is active.
 */
export async function fetchAllEmployees(): Promise<Employee[]> {
  try {
    let url: string | null = '/v1/hr/employees/';
    let allEmployees: Employee[] = [];

    while (url) {
      const response = await apiCall(url, {
        requiresAuth: true,
        method: 'GET',
      });

      if (Array.isArray(response)) {
        // Fallback if pagination is turned off entirely
        return response;
      } else if (response && Array.isArray(response.results)) {
        allEmployees = allEmployees.concat(response.results);
        
        // Check if there's a next page. Extract pathname + search query if it's an absolute URL.
        if (response.next) {
          const nextUrl = new URL(response.next);
          url = nextUrl.pathname + nextUrl.search;
        } else {
          url = null;
        }
      } else {
        break;
      }
    }

    return allEmployees;
  } catch (error) {
    console.error('Failed to fetch employees list:', error);
    throw error;
  }
}