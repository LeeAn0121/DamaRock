const fs = require('fs');

// Patch App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
appCode = appCode.replace(
  'deleteItem={data.deleteItem}',
  'deleteItem={data.deleteItem}\n        restoreItem={data.restoreItem}\n        hardDeleteItem={data.hardDeleteItem}'
);
fs.writeFileSync('src/App.tsx', appCode);

// Patch HomeList.tsx Props
let homeCode = fs.readFileSync('src/HomeList.tsx', 'utf-8');
homeCode = homeCode.replace(
  'deleteItem: (id: string) => void;',
  'deleteItem: (id: string) => void;\n  restoreItem: (id: string) => void;\n  hardDeleteItem: (id: string) => void;'
);

// Patch HomeList.tsx item filtering
homeCode = homeCode.replace(
  'const activeItems = viewState === "empty" ? [] : items.filter(i => i.title !== "__SYSTEM_FOLDERS__");',
  'const activeItems = viewState === "empty" ? [] : items.filter(i => i.title !== "__SYSTEM_FOLDERS__" && !i.deleted_at);\n  const deletedItems = viewState === "empty" ? [] : items.filter(i => i.title !== "__SYSTEM_FOLDERS__" && i.deleted_at);'
);

// Pass deletedItems and new functions to GroceryFolders
homeCode = homeCode.replace(
  'unassigned={inbox}',
  'unassigned={inbox}\n                deletedItems={deletedItems}'
);
homeCode = homeCode.replace(
  'onDelete={handleDelete}',
  'onDelete={handleDelete}\n                onRestore={props.restoreItem}\n                onHardDelete={props.hardDeleteItem}'
);

fs.writeFileSync('src/HomeList.tsx', homeCode);

// Patch GroceryFolders.tsx Props
let groceryCode = fs.readFileSync('src/GroceryFolders.tsx', 'utf-8');
groceryCode = groceryCode.replace(
  'unassigned: Item[];',
  'unassigned: Item[];\n  deletedItems?: Item[];\n  onRestore?: (id: string) => void;\n  onHardDelete?: (id: string) => void;'
);

groceryCode = groceryCode.replace(
  'unassigned,\n  members,',
  'unassigned,\n  deletedItems = [],\n  onRestore,\n  onHardDelete,\n  members,'
);

// Update deleted_folder render
const oldDeletedFolder = /\{\/\* Deleted Folder \(Placeholder for Backend Extension\) \*\/\}.*?<\/section>/s;
const newDeletedFolder = `
        {/* Deleted Folder */}
        <section className={clsx("flex flex-col rounded-2xl bg-surface px-4 shadow-sm border border-border/40 transition-all opacity-70", collapsed["deleted_folder"] ? "py-2.5" : "py-3")}>
          <div className={clsx("flex items-center justify-between transition-all", !collapsed["deleted_folder"] ? "mb-3 border-b border-border/40 pb-2" : "")}>
            <button
              onClick={() => setCollapsed(prev => ({ ...prev, "deleted_folder": !prev["deleted_folder"] }))}
              className="flex items-center gap-2 flex-1 text-left"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-chrome text-muted-foreground">
                <IconTrash size={16} />
              </div>
              <h3 className="text-base font-extrabold flex items-center gap-2 text-muted-foreground">
                삭제됨 <span className="text-muted-foreground/60 font-normal text-sm">({deletedItems.length})</span>
              </h3>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">30일 후 자동 삭제</span>
              <button
                onClick={() => setCollapsed(prev => ({ ...prev, "deleted_folder": !prev["deleted_folder"] }))}
                className="text-muted-foreground p-1 hover:bg-chrome rounded-full transition-colors active:scale-95"
              >
                {collapsed["deleted_folder"] ? <IconChevronRight size={18} /> : <IconChevronDown size={18} />}
              </button>
            </div>
          </div>
          {!collapsed["deleted_folder"] && (
            <div className="flex-1 animate-in fade-in slide-in-from-top-2 duration-200 pb-2">
              {deletedItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">삭제된 항목이 없습니다</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {deletedItems.map(item => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground line-through decoration-muted-foreground/30">{item.title}</span>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => onRestore?.(item.id)}
                          className="inline-flex min-h-8 items-center justify-center rounded-lg border border-border/80 px-3 text-xs font-bold text-muted-foreground transition-all hover:bg-chrome active:scale-95"
                        >
                          복구
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) onHardDelete?.(item.id);
                          }}
                          className="inline-flex min-h-8 w-8 items-center justify-center rounded-lg border border-danger/20 text-danger transition-all hover:bg-danger/10 active:scale-95"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
`;

groceryCode = groceryCode.replace(oldDeletedFolder, newDeletedFolder.trim());
fs.writeFileSync('src/GroceryFolders.tsx', groceryCode);
