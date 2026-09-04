export type NodeType = "mother_company" | "sub_company" | "cabinet" | "folder" | "file";

export interface TreeNodeItem {
  id: string;
  name: string;
  type: NodeType;
  children?: TreeNodeItem[];
  files?: TreeNodeItem[];
  updated_at?: string;
  size?: string;
}

export interface SelectedNode {
  item: TreeNodeItem;
  trail: TreeNodeItem[];
  fullPath: string;
  slashPath: string;
}

export const TYPE_LABEL: Record<NodeType, string> = {
  mother_company: "Mother Company",
  sub_company: "Sub Company",
  cabinet: "Cabinet",
  folder: "Folder",
  file: "File",
};

export function childrenOf(item: TreeNodeItem): TreeNodeItem[] {
  return [...(item.children ?? []), ...(item.files ?? [])];
}

export function toSelection(trail: TreeNodeItem[], separator = " / "): SelectedNode {
  const item = trail[trail.length - 1];
  const names = trail.map((n) => n.name);
  return {
    item,
    trail,
    fullPath: names.join(separator),
    slashPath: "/" + names.join("/"),
  };
}

export function findTrail(items: TreeNodeItem[], id: string): TreeNodeItem[] | null {
  for (const item of items) {
    if (item.id === id) return [item];
    const child = findTrail(childrenOf(item), id);
    if (child) return [item, ...child];
  }
  return null;
}

export function findTrailByPath(items: TreeNodeItem[], path: string): TreeNodeItem[] | null {
  const parts = path
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((p) => p.trim());
  if (!parts.length) return null;

  function walk(nodes: TreeNodeItem[], depth: number): TreeNodeItem[] | null {
    for (const node of nodes) {
      if (node.name === parts[depth]) {
        if (depth === parts.length - 1) return [node];
        const child = walk(childrenOf(node), depth + 1);
        if (child) return [node, ...child];
      }
    }
    return null;
  }

  return walk(items, 0);
}
