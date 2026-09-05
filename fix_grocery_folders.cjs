const fs = require('fs');
let code = fs.readFileSync('src/GroceryFolders.tsx', 'utf-8');

const targetStr = 'const groceryItems = items.filter((i) => i.category === "grocery" && i.title !== "__SYSTEM_FOLDERS__");';
const insertStr = `  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const deletedItems = items.filter(i => i.deleted_at && i.deleted_at > thirtyDaysAgo);`;

code = code.replace(targetStr, targetStr + '\n' + insertStr);

fs.writeFileSync('src/GroceryFolders.tsx', code);
