// C:\Users\allan.muyesu\Desktop\my-app\lib\expiringContracts.ts
import { apiCall } from '@/lib/api';

export interface ExpiringEmployee {
  id: string;
  staff_no: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  department_name?: string;
  position_title?: string;
  status: string;
  contract_type: string;
  contract_expiry: string;
  tenant_id?: string;
  [key: string]: any;
}

/**
 * Fetches expiring (and optionally already-expired) contracts.
 * @param days Number of days into the future to check (default: 30)
 * @param includeExpired Whether to include contracts that have already passed/expired (default: true)
 */
export async function fetchExpiringContracts(
  days: number = 30, 
  includeExpired: boolean = true
): Promise<ExpiringEmployee[]> {
  try {
    const endpoint = `/v1/hr/employees/expiring/?days=${days}&include_expired=${includeExpired}`;
    
    const response = await apiCall(endpoint, { 
      requiresAuth: true,
      method: 'GET'
    });

    return Array.isArray(response) ? response : response?.results || [];
  } catch (error) {
    console.error('Failed to fetch expiring contracts:', error);
    throw error;
  }
}