const fs = require('fs');

// 1. HomeList.tsx & Circular Dep
let homeCode = fs.readFileSync('src/HomeList.tsx', 'utf-8');
homeCode = homeCode.replace(
  'import GroceryFolders from "./GroceryFolders";',
  'import GroceryFolders from "./GroceryFolders";\nimport { ItemRows, DoneDisclosure, ActionableItem } from "./ItemRows";'
);
const startIdx = homeCode.indexOf('export function ActionableItem({');
const endIdx = homeCode.indexOf('function EmptyState() {');
if (startIdx !== -1 && endIdx !== -1) {
  homeCode = homeCode.substring(0, startIdx) + homeCode.substring(endIdx);
}
// Swipe fix in HomeList
homeCode = homeCode.replace(
  'const [touchStartX, setTouchStartX] = useState<number | null>(null);',
  'const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);'
);
homeCode = homeCode.replace(
  'setTouchStartX(e.targetTouches[0].clientX);',
  'setTouchStart({x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY});'
);
const oldTouchEnd = `
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left
      } else {
        // Swiped right
      }
    }
    setTouchStartX(null);
  };
`;
const newTouchEnd = `
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStart.x - touchEndX;
    const diffY = touchStart.y - touchEndY;
    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 40) {
      if (diffX > 0) {
        setCurrentTab("todo");
      } else {
        setCurrentTab("grocery");
      }
    }
    setTouchStart(null);
  };
`;
homeCode = homeCode.replace(oldTouchEnd.trim(), newTouchEnd.trim());
fs.writeFileSync('src/HomeList.tsx', homeCode);

// 2. GroceryFolders.tsx
let groceryCode = fs.readFileSync('src/GroceryFolders.tsx', 'utf-8');
groceryCode = groceryCode.replace(
  'import { ItemRows, DoneDisclosure } from "./HomeList";',
  'import { ItemRows, DoneDisclosure } from "./ItemRows";'
);
// Split meta
groceryCode = groceryCode.replace(
  'const folderId = item.meta;',
  'const folderId = item.meta?.split("::MEMO::")[0];'
);
groceryCode = groceryCode.replace(
  'const folderId = i.meta;',
  'const folderId = i.meta?.split("::MEMO::")[0];'
);
fs.writeFileSync('src/GroceryFolders.tsx', groceryCode);

// 3. ItemRows.tsx Action Popup Z-Index (from z-[70] to z-[130])
let itemRows = fs.readFileSync('src/ItemRows.tsx', 'utf-8');
itemRows = itemRows.replace('z-[60]', 'z-[120]').replace('z-[70]', 'z-[130]');
fs.writeFileSync('src/ItemRows.tsx', itemRows);

// 4. useAppData.ts
let appDataCode = fs.readFileSync('src/hooks/useAppData.ts', 'utf-8');
appDataCode = appDataCode.replace(
  'created_at: string;',
  'created_at: string;\n  deleted_at: string | null;'
);
appDataCode = appDataCode.replace(
  '.select("id, title, category, done, added_by, assignee, meta, created_at")',
  '.select("id, title, category, done, added_by, assignee, meta, created_at, deleted_at")'
);
appDataCode = appDataCode.replace(
  'created_at: r.created_at,',
  'created_at: r.created_at,\n          deleted_at: r.deleted_at,'
);
// Make sure InviteRow has created_at
appDataCode = appDataCode.replace(
  'invited_email: string | null;',
  'invited_email: string | null;\n  created_at: string;'
);
appDataCode = appDataCode.replace(
  '.select("id, invited_name, invited_email")',
  '.select("id, invited_name, invited_email, created_at")'
);
const oldInviteSet = `setInvites(\n        (inviteRows ?? []).map((r) => ({ id: r.id, invitedName: r.invited_name, invitedEmail: r.invited_email }))\n      );`;
const newInviteSet = `const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();\n      setInvites(\n        (inviteRows ?? [])\n          .filter(r => r.created_at > oneDayAgo)\n          .map((r) => ({ id: r.id, invitedName: r.invited_name, invitedEmail: r.invited_email }))\n      );`;
appDataCode = appDataCode.replace(oldInviteSet, newInviteSet);
fs.writeFileSync('src/hooks/useAppData.ts', appDataCode);
