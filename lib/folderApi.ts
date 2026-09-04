import { apiCall } from "@/lib/api";

interface CreateFolderPayload {
  name: string;
  parent?: string | null;
  cabinet?: string | null;
  folder_type?: "generic" | "employee" | "department" | "client";
  tenant?: string | null;
}

export async function createFolder(payload: CreateFolderPayload) {
  const activeTenantId = payload.tenant || (typeof window !== "undefined" ? localStorage.getItem("current_tenant_id") : null);
  
  return await apiCall("/v1/documents/folders/", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({
      folder_type: "generic",
      ...payload,
      tenant: activeTenantId,
    }),
  });
}

export async function updateFolder(folderId: string, payload: Partial<CreateFolderPayload>) {
  return await apiCall(`/v1/documents/folders/${folderId}/`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function deleteFolder(folderId: string) {
  return await apiCall(`/v1/documents/folders/${folderId}/`, {
    method: "DELETE",
    requiresAuth: true,
  });
}