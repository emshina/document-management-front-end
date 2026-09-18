// lib/dmsClipboard.ts
export type ClipItem = {
  id: string;
  name: string;
  kind: "folder" | "document";
  mode: "cut" | "copy";
};

let clip: ClipItem | null = null;
const listeners = new Set<() => void>();

export const setClipboard = (item: ClipItem | null) => {
  clip = item;
  listeners.forEach((l) => l());
};
export const getClipboard = () => clip;
export const onClipboardChange = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
