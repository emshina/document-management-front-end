'use client';
import { apiCall } from '@/lib/api';

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'cabinet' | 'sub_company' | 'mother_company';
  path?: string;
  folder_type?: 'generic' | 'department' | 'employee' | 'client';
  is_locked?: boolean;
  children?: FolderItem[];
}

export interface CabinetItem {
  id: string;
  name: string;
  type: 'cabinet';
  children?: FolderItem[];
}

export interface SubCompanyItem {
  id: string;
  name: string;
  type: 'sub_company';
  children?: CabinetItem[];
}

export interface MotherCompanyItem {
  id: string;
  name: string;
  type: 'mother_company';
  children?: SubCompanyItem[];
}

export type TreeNodeItem = MotherCompanyItem | SubCompanyItem | CabinetItem | FolderItem;

export interface EmployeePopupData {
  staff_no: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  national_id: string;
  kra_pin?: string | null;
  email: string;
  phone: string;
  contract_type: string;
  date_joined: string; // YYYY-MM-DD
  location?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  nssf_no?: string | null;
  nhif_no?: string | null;
  salary?: number | null;
  department?: string | null; // ID of Department
  position?: string | null;   // ID of Position
}

// Helper to handle DRF paginated responses and clean absolute URLs safely
async function fetchAllPaginated(endpoint: string) {
  let results: any[] = [];
  let url: string | null = endpoint;

  while (url) {
    let fetchUrl = url;

    // If DRF returns an absolute URL for 'next', extract only the pathname and query string
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const parsed = new URL(url);
        fetchUrl = parsed.pathname + parsed.search;
      } catch (e) {
        // Fallback if parsing fails
      }
    }

    // Ensure no duplicate /api/ prefixes happen
    fetchUrl = fetchUrl.replace(/^\/api\/api\//, '/api/');

    const response = await apiCall(fetchUrl, { method: 'GET', requiresAuth: true });
    
    if (response && response.results) {
      results = results.concat(response.results);
      url = response.next;
    } else if (Array.isArray(response)) {
      results = results.concat(response);
      break;
    } else {
      break;
    }
  }
  return results;
}

// 1. Fetch the complete 4-tier tree from the optimized backend endpoint
export async function fetchFolderTree(): Promise<MotherCompanyItem[]> {
  const response = await apiCall('/api/v1/documents/folders/tree/', {
    method: 'GET',
    requiresAuth: true,
  });

  return Array.isArray(response) ? response : [];
}

// 2. Fetch contents dynamically based on any node type (Mother Company, Sub-Company, Cabinet, or Folder)
export async function fetchFolderContents(id: string, type: TreeNodeItem['type'] = 'folder') {
  let folders: any[] = [];
  let documents: any[] = [];

  if (!id || id === 'default-folder-id') {
    return { folders: [], documents: [] };
  }

  // 1. Mother Company -> Returns Sub-Companies
  if (type === 'mother_company') {
    const allTenants = await fetchAllPaginated('/api/v1/tenants/tenants/');
    folders = allTenants.filter((t: any) => t.parent === id).map((t: any) => ({ ...t, type: 'sub_company' }));
  } 
  // 2. Sub Company -> Returns Cabinets owned by this tenant
  else if (type === 'sub_company') {
    const allCabinets = await fetchAllPaginated('/api/v1/documents/cabinets/');
    folders = allCabinets.filter((c: any) => c.tenant === id || c.tenant_id === id).map((c: any) => ({ ...c, type: 'cabinet' }));
  } 
  // 3. Cabinet -> Returns root folders (parent is null) and documents directly inside the cabinet
  else if (type === 'cabinet') {
    const [foldersData, documentsData] = await Promise.all([
      fetchAllPaginated(`/api/v1/documents/folders/?cabinet=${id}`),
      fetchAllPaginated(`/api/v1/documents/documents/?cabinet=${id}`),
    ]);
    folders = foldersData.filter((f: any) => !f.parent).map((f: any) => ({ ...f, type: 'folder' }));
    documents = documentsData;
  } 
  // 4. Folder -> Returns sub-folders and documents inside this specific folder
  else if (type === 'folder') {
    const [foldersData, documentsData] = await Promise.all([
      fetchAllPaginated(`/api/v1/documents/folders/?parent=${id}`),
      fetchAllPaginated(`/api/v1/documents/documents/?folder=${id}`),
    ]);
    folders = foldersData.map((f: any) => ({ ...f, type: 'folder' }));
    documents = documentsData;
  }

  return { folders, documents };
}

// 3. Create a Sub-Company under a Mother Company
export async function createSubCompany(name: string, parentTenantId: string) {
  return apiCall('/api/v1/tenants/tenants/', {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify({
      name: name.trim(),
      parent_id: parentTenantId,
    }),
  });
}

// 4. Create a Cabinet inside a Sub-Company (Tenant)
export async function createCabinet(name: string, tenantId: string) {
  const payload = {
    name: name.trim(),
    tenant: tenantId,
  };

  return apiCall('/api/v1/documents/cabinets/', {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

// 5. Create a Folder inside a Cabinet or parent folder with specific folder types, lock options, & optional employee details
export async function createFolderItem(
  name: string, 
  targetId: string, 
  targetType: 'cabinet' | 'folder' = 'cabinet',
  folderType: 'generic' | 'department' | 'employee' | 'client' = 'generic',
  isLocked: boolean = false,
  employeeData?: EmployeePopupData
) {
  let cabinetId = targetId;
  let parentId: string | null = null;

  if (targetType === 'folder') {
    const allFolders = await fetchAllPaginated('/api/v1/documents/folders/');
    const targetFolder = allFolders.find((f: any) => f.id === targetId);
    
    if (targetFolder) {
      cabinetId = targetFolder.cabinet;
      parentId = targetFolder.id;
    }
  }

  const payload: any = {
    name: name.trim(),
    cabinet: cabinetId,
    parent: parentId,
    folder_type: folderType,
    is_locked: isLocked,
  };

  if (folderType === 'employee' && employeeData) {
    Object.assign(payload, employeeData);
  }

  return apiCall('/api/v1/documents/folders/', {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

// 6. Delete a folder, cabinet, or tenant item based on type
export async function deleteFolderItem(id: string, type: TreeNodeItem['type'] = 'folder') {
  let endpoint = `/api/v1/documents/folders/${id}/`;
  
  if (type === 'sub_company' || type === 'mother_company') {
    endpoint = `/api/v1/tenants/tenants/${id}/`;
  } else if (type === 'cabinet') {
    endpoint = `/api/v1/documents/cabinets/${id}/`;
  }

  return apiCall(endpoint, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

// 7. Update, rename, or patch a folder, cabinet, or tenant item based on type
export async function updateFolderItem(id: string, name: string, type: TreeNodeItem['type'] = 'folder') {
  let endpoint = `/api/v1/documents/folders/${id}/`;
  let body: any = { name: name.trim() };

  if (type === 'sub_company' || type === 'mother_company') {
    endpoint = `/api/v1/tenants/tenants/${id}/`;
  } else if (type === 'cabinet') {
    endpoint = `/api/v1/documents/cabinets/${id}/`;
  }

  return apiCall(endpoint, {
    method: 'PATCH',
    requiresAuth: true,
    body: JSON.stringify(body),
  });
}

// 8. Move a folder to a new parent folder, cabinet, or tenant
export async function moveFolderItem(
  id: string,
  targetDestination: { parent?: string | null; cabinet?: string | null; tenant?: string | null },
  type: TreeNodeItem['type'] = 'folder'
) {
  if (type === 'cabinet') {
    return apiCall(`/api/v1/documents/cabinets/${id}/`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify({ tenant: targetDestination.tenant }),
    });
  }

  if (type === 'sub_company' || type === 'mother_company') {
    return apiCall(`/api/v1/tenants/tenants/${id}/`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify({ parent_id: targetDestination.tenant }),
    });
  }

  return apiCall(`/api/v1/documents/folders/${id}/move/`, {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify({
      parent: targetDestination.parent ?? null,
      cabinet: targetDestination.cabinet ?? null,
      tenant: targetDestination.tenant ?? null,
    }),
  });
}