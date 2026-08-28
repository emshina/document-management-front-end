import { apiCall } from '@/lib/api';

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'cabinet' | 'sub_company' | 'mother_company';
  path?: string;
  folder_type?: string;
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

// 1. Fetch the complete 4-tier tree: Mother Company -> Sub-Companies -> Cabinets -> Folders
export async function fetchFolderTree(): Promise<MotherCompanyItem[]> {
  const [tenants, cabinets, folders] = await Promise.all([
    fetchAllPaginated('/api/v1/tenants/tenants/'),
    fetchAllPaginated('/api/v1/documents/cabinets/'),
    fetchAllPaginated('/api/v1/documents/folders/'),
  ]);

  const motherCompanies = tenants.filter((t: any) => !t.parent);
  const subCompanies = tenants.filter((t: any) => t.parent);

  const buildFolderTree = (parentId: string | null, cabinetId: string): FolderItem[] => {
    return folders
      .filter((f: any) => f.cabinet === cabinetId && (parentId === null ? !f.parent : f.parent === parentId))
      .map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        path: folder.path,
        folder_type: folder.folder_type,
        is_locked: folder.is_locked,
        children: buildFolderTree(folder.id, cabinetId),
      }));
  };

  return motherCompanies.map((mother: any) => {
    const childrenSubs = subCompanies.filter((sub: any) => sub.parent === mother.id);

    return {
      id: mother.id,
      name: mother.name,
      type: 'mother_company' as const,
      children: childrenSubs.map((sub: any) => {
        const subCabinets = cabinets.filter((cab: any) => cab.owner === sub.id || cab.tenant === sub.id || cab.tenant_id === sub.id);

        return {
          id: sub.id,
          name: sub.name,
          type: 'sub_company' as const,
          children: subCabinets.map((cab: any) => ({
            id: cab.id,
            name: cab.name,
            type: 'cabinet' as const,
            children: buildFolderTree(null, cab.id),
          })),
        };
      }),
    };
  });
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

// 5. Create a Folder inside a Cabinet or parent folder
export async function createFolderItem(name: string, targetId: string, targetType: 'cabinet' | 'folder' = 'cabinet') {
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

  return apiCall('/api/v1/documents/folders/', {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify({
      name,
      cabinet: cabinetId,
      parent: parentId,
      folder_type: 'generic',
      is_locked: false,
    }),
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