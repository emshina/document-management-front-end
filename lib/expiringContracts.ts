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

export async function fetchExpiringContracts(days: number = 30): Promise<ExpiringEmployee[]> {
  try {
    // Aligned with your project's /v1/hr/ prefix structure
    const response = await apiCall(`/v1/hr/employees/expiring/?days=${days}`, { 
      requiresAuth: true,
      method: 'GET'
    });

    return Array.isArray(response) ? response : response?.results || [];
  } catch (error) {
    console.error('Failed to fetch expiring contracts:', error);
    throw error;
  }
}