import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import FolderTree from "@/components/FolderTree";
import DocumentContentArea from "@/components/DocumentContentArea";
import type { SelectedNode, TreeNodeItem } from "@/lib/tree";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Document Explorer — Synced Folder Tree & Breadcrumbs" },
      {
        name: "description",
        content:
          "Browse companies, cabinets and folders in a resizable tree with breadcrumbs that stay in sync and always show your full path.",
      },
      { property: "og:title", content: "Document Explorer" },
      {
        property: "og:description",
        content:
          "Resizable organization tree with two-way synced breadcrumbs and full path display for companies, cabinets, folders and files.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const demoTree: TreeNodeItem[] = [
  {
    id: "m1",
    name: "CDL Holding Group Limited",
    type: "mother_company",
    children: [
      {
        id: "s1",
        name: "CDL East Africa",
        type: "sub_company",
        children: [
          {
            id: "c1",
            name: "Finance Cabinet",
            type: "cabinet",
            children: [
              {
                id: "f1",
                name: "Invoices",
                type: "folder",
                updated_at: "9/4/2026",
                children: [{ id: "f2", name: "2026", type: "folder", updated_at: "9/4/2026" }],
                files: [
                  {
                    id: "d1",
                    name: "invoice-001.pdf",
                    type: "file",
                    updated_at: "9/4/2026",
                    size: "184 KB",
                  },
                ],
              },
              { id: "f3", name: "Payroll", type: "folder", updated_at: "8/28/2026" },
            ],
          },
          {
            id: "c2",
            name: "HR Cabinet",
            type: "cabinet",
            children: [
              { id: "f4", name: "Contracts", type: "folder", updated_at: "7/12/2026" },
              { id: "f5", name: "Appraisal", type: "folder", updated_at: "7/12/2026" },
            ],
          },
        ],
      },
      { id: "s2", name: "CDL Europe", type: "sub_company" },
    ],
  },
];

function Index() {
  const [selection, setSelection] = useState<SelectedNode | null>(null);

  return (
    <main className="flex h-screen overflow-hidden bg-background">
      <FolderTree
        data={demoTree}
        selectedId={selection?.item.id ?? null}
        onSelect={setSelection}
      />
      <DocumentContentArea data={demoTree} selection={selection} onSelect={setSelection} />
    </main>
  );
}
