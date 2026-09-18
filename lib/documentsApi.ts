// lib/documentsApi.ts
import { apiCall } from "@/lib/api";

const BASE = "/v1/documents";

/* ----------------------------- Cabinets ----------------------------- */
export const listCabinets = () =>
  apiCall(`${BASE}/cabinets/`, { method: "GET", requiresAuth: true });

/* ------------------------------ Folders ----------------------------- */
export const listFolders = (params: Record<string, string> = {}) =>
  apiCall(`${BASE}/folders/?${new URLSearchParams(params)}`, {
    method: "GET",
    requiresAuth: true,
  });

export const createFolder = (payload: {
  name: string;
  parent?: string | null;
  cabinet?: string | null;
  tenant?: string | null;
  folder_type?: string;
}) =>
  apiCall(`${BASE}/folders/`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });

export const renameFolder = (id: string, name: string) =>
  apiCall(`${BASE}/folders/${id}/`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify({ name }),
  });

export const deleteFolder = (id: string) =>
  apiCall(`${BASE}/folders/${id}/`, { method: "DELETE", requiresAuth: true });

/** Backend accepts ONE of: parent | cabinet | tenant */
export const moveFolder = (
  id: string,
  target: { parent?: string; cabinet?: string; tenant?: string }
) =>
  apiCall(`${BASE}/folders/${id}/move/`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(target),
  });

export const pinFolder = (id: string) =>
  apiCall(`${BASE}/folders/${id}/pin/`, { method: "POST", requiresAuth: true });

export const unpinFolder = (id: string) =>
  apiCall(`${BASE}/folders/${id}/unpin/`, { method: "POST", requiresAuth: true });

/* ----------------------------- Documents ---------------------------- */
export const getDocument = (id: string) =>
  apiCall(`${BASE}/documents/${id}/`, { method: "GET", requiresAuth: true });

export const deleteDocument = (id: string) =>
  apiCall(`${BASE}/documents/${id}/`, { method: "DELETE", requiresAuth: true });

export const renameDocument = (id: string, name: string) =>
  apiCall(`${BASE}/documents/${id}/`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify({ name }),
  });

/** Move a document = change its folder (no custom action exists server-side) */
export const moveDocument = (id: string, folderId: string) =>
  apiCall(`${BASE}/documents/${id}/`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify({ folder: folderId }),
  });

export const setDocumentStatus = (id: string, status: string, comment = "") =>
  apiCall(`${BASE}/documents/${id}/status/`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ status, comment }),
  });

export const pinDocument = (id: string) =>
  apiCall(`${BASE}/documents/${id}/pin/`, { method: "POST", requiresAuth: true });

export const unpinDocument = (id: string) =>
  apiCall(`${BASE}/documents/${id}/unpin/`, { method: "POST", requiresAuth: true });

export const uploadDocument = (form: FormData) =>
  apiCall(`${BASE}/documents/`, { method: "POST", requiresAuth: true, body: form });

/**
 * Download returns a binary FileResponse, so we bypass apiCall's JSON parsing
 * and hit fetch directly with the same token your apiCall uses.
 */
export async function downloadDocument(id: string, filename = "document") {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") || localStorage.getItem("token")
      : null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ""}${BASE}/documents/${id}/download/`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!res.ok) throw new Error("Download failed");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------ Search ------------------------------ */
export const searchDocuments = (q: string) =>
  apiCall(`${BASE}/search/?q=${encodeURIComponent(q)}`, {
    method: "GET",
    requiresAuth: true,
  });

/* -------------------------- Folder templates ------------------------ */
export const listFolderTemplates = () =>
  apiCall(`${BASE}/folder-templates/`, { method: "GET", requiresAuth: true });

export const getTemplateItems = (templateId: string) =>
  apiCall(`${BASE}/folder-templates/${templateId}/items/`, {
    method: "GET",
    requiresAuth: true,
  });

/** Pass parent_folder_id when inside a folder, otherwise cabinet_id */
export const applyFolderTemplate = (
  templateId: string,
  target: { cabinet_id?: string; parent_folder_id?: string }
) =>
  apiCall(`${BASE}/folder-templates/${templateId}/apply/`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(target),
  });

/* --------------------------- Shareable links ------------------------ */
export const createShareLink = (payload: {
  document?: string;
  folder?: string;
  expires_at?: string | null;
  tenant?: string | null;
}) =>
  apiCall(`${BASE}/share-links/`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });

/* ---------------------------- Upload links -------------------------- */
export const createUploadLink = (payload: {
  folder: string;
  expires_at?: string | null;
  tenant?: string | null;
}) =>
  apiCall(`${BASE}/upload-links/`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
