const fs = require('fs');
let code = fs.readFileSync('src/HomeList.tsx', 'utf-8');

// Update item filtering
code = code.replace(
  'const activeItems = viewState === "empty" ? [] : items.filter(i => i.title !== "__SYSTEM_FOLDERS__");',
  'const activeItems = viewState === "empty" ? [] : items.filter(i => i.title !== "__SYSTEM_FOLDERS__" && !i.deleted_at);\n  const deletedItems = viewState === "empty" ? [] : items.filter(i => i.deleted_at);'
);

// We need to fetch restoreItem and hardDeleteItem from props, BUT they are in App.tsx!
// Let's check App.tsx first.
