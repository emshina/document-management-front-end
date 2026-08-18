export interface FolderItem {
  id: string;
  name: string;
  type: 'cabinet' | 'folder' | 'document';
  updatedAt: string;
  children?: FolderItem[];
}

export const mockFolderTree: FolderItem[] = [
  {
    id: 'cdl-holding',
    name: 'CDL Holding Group Limited',
    type: 'cabinet',
    updatedAt: '3/31/2026',
    children: [
      {
        id: 'test-download',
        name: '1.Test Download',
        type: 'folder',
        updatedAt: '3/31/2026',
        children: [
          { id: 'test-2', name: 'Test 2', type: 'folder', updatedAt: '3/31/2026' },
          { id: 'test-employee', name: 'Test Employee', type: 'folder', updatedAt: '3/31/2026' },
        ],
      },
      {
        id: 'aar-insurance',
        name: 'AAR Insurance Kenya Limited',
        type: 'folder',
        updatedAt: '3/31/2026',
      },
      {
        id: 'career-directions',
        name: 'Career Directions Limited',
        type: 'folder',
        updatedAt: '3/31/2026',
      },
    ],
  },
];

export const mockCurrentFolderContents = [
  { id: 'item-2', name: 'Test 2', type: 'folder', updatedAt: '3/31/2026' },
  { id: 'item-3', name: 'Test Employee', type: 'folder', updatedAt: '3/31/2026' },
];