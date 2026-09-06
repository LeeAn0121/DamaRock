import { useState, useMemo } from "react";
import type { Item, Member } from "./data";
import { IconFolder, IconPlus, IconTrash, IconChevronDown, IconChevronRight, IconCheck } from "@tabler/icons-react";
import { ItemRows, DoneDisclosure } from "./ItemRows";
import { showToast } from "./components/Toast";
import { useI18n } from "./lib/i18n";
import clsx from "clsx";

export type Folder = { id: string; name: string; icon: string };

type PopupState =
  | { type: 'NONE' }
  | { type: 'CREATE_FOLDER' }
  | { type: 'CHANGE_ICON', folderId: string }
  | { type: 'CONFIRM_DELETE', folderId: string }
  | { type: 'MOVE_ITEM', item: Item };

export default function GroceryFolders({
  items,
  members,
  comments = [],
  userId,
  onToggleDone,
  onDelete,
  onEdit,
  onSelect,
  addItem,
  editItem,
  onRestore,
  onHardDelete,
}: {
  items: Item[];
  members: Member[];
  comments?: import("./data").Comment[];
  userId?: string | null;
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
  onSelect: (item: Item) => void;
  addItem: (item: Pick<Item, "title" | "category" | "meta">) => void;
  editItem: (id: string, title: string, meta?: string | null) => void;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const [popup, setPopup] = useState<PopupState>({ type: 'NONE' });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ "done_folder": true });
  const [inputValue, setInputValue] = useState("");

  const systemItem = items.find((i) => i.title === "__SYSTEM_FOLDERS__");
  // A deleted item belongs only in the "삭제됨" section below — it must not
  // also linger in its old folder or the purchased list.
  const groceryItems = items.filter((i) => i.category === "grocery" && i.title !== "__SYSTEM_FOLDERS__" && !i.deleted_at);
  const purchasedItems = items.filter((i) => i.done && !i.deleted_at);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const deletedItems = items.filter(i => i.deleted_at && i.deleted_at > thirtyDaysAgo);

  const folders: Folder[] = useMemo(() => {
    if (!systemItem?.meta) return [];
    try {
      return JSON.parse(systemItem.meta) as Folder[];
    } catch {
      return [];
    }
  }, [systemItem]);

  const saveFolders = (newFolders: Folder[]) => {
    const meta = JSON.stringify(newFolders);
    if (systemItem) {
      editItem(systemItem.id, "__SYSTEM_FOLDERS__", meta);
    } else {
      addItem({ title: "__SYSTEM_FOLDERS__", category: "system", meta });
    }
  };

  const handleCreateFolderClick = () => {
    setInputValue("");
    setPopup({ type: 'CREATE_FOLDER' });
  };

  const handleConfirmPopup = () => {
    if (popup.type === 'CREATE_FOLDER') {
      if (!inputValue.trim()) {
        showToast(t("grocery.folderNamePrompt"));
        return;
      }
      saveFolders([...folders, { id: Date.now().toString(), name: inputValue.trim(), icon: "📁" }]);
      showToast(t("grocery.folderCreated"));
      setPopup({ type: 'NONE' });
      setInputValue("");
    } else if (popup.type === 'CHANGE_ICON') {
      if (!inputValue.trim()) {
        showToast(t("grocery.iconPrompt"));
        return;
      }
      const newFolders = folders.map(f => f.id === popup.folderId ? { ...f, icon: inputValue.trim() } : f);
      saveFolders(newFolders);
      showToast(t("grocery.iconChanged"));
      setPopup({ type: 'NONE' });
      setInputValue("");
    } else if (popup.type === 'CONFIRM_DELETE') {
      saveFolders(folders.filter(f => f.id !== popup.folderId));
      showToast(t("grocery.folderDeleted"));
      setPopup({ type: 'NONE' });
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    map.set("unassigned", []);
    for (const f of folders) {
      map.set(f.id, []);
    }
    for (const item of groceryItems) {
      const folderId = item.meta?.split("::MEMO::")[0];
      if (folderId && map.has(folderId)) {
        map.get(folderId)!.push(item);
      } else {
        map.get("unassigned")!.push(item);
      }
    }
    return map;
  }, [groceryItems, folders]);

  const unassigned = grouped.get("unassigned") || [];

  const handleMove = (item: Item) => {
    if (folders.length === 0) {
      showToast(t("grocery.noFolders"));
      return;
    }
    setPopup({ type: 'MOVE_ITEM', item });
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center px-2 mt-4">
        <h2 className="text-sm font-bold text-muted-foreground">{t("grocery.itemsHeading")} ({groceryItems.filter(i => !i.done).length})</h2>
      </div>

      <div className="flex flex-col gap-5">
        {/* Active folders — one grouped surface with hairline dividers, not a stack of separate cards */}
        <div className="flex flex-col rounded-2xl bg-surface shadow-sm border border-border/40 divide-y divide-border/40">
          {folders.map(folder => {
            const folderItems = grouped.get(folder.id) || [];
            const active = folderItems.filter(i => !i.done);
            const isCollapsed = collapsed[folder.id];

            return (
              <div key={folder.id} className={clsx("flex flex-col px-4 transition-all", isCollapsed ? "py-2.5" : "py-3")}>
                <div className={clsx("flex items-center justify-between transition-all", !isCollapsed ? "mb-3 border-b border-border/40 pb-2" : "")}>
                  <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    <button onClick={() => toggleCollapse(folder.id)} className="text-muted-foreground hover:text-foreground active:scale-90 transition-transform p-1">
                      {isCollapsed ? <IconChevronRight size={18}/> : <IconChevronDown size={18}/>}
                    </button>
                    <button
                      className="text-xl active:scale-90 transition-transform hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInputValue(folder.icon);
                        setPopup({ type: 'CHANGE_ICON', folderId: folder.id });
                      }}
                      title={t("grocery.changeIconTitle")}
                    >
                      {folder.icon}
                    </button>
                    <div className="flex flex-col flex-1 min-w-0" onClick={() => toggleCollapse(folder.id)}>
                      <h3 className="text-base font-extrabold flex items-center gap-2 text-foreground cursor-pointer truncate">
                        {folder.name} <span className="text-muted-foreground font-normal text-sm">({active.length})</span>
                      </h3>
                      {isCollapsed && active.length > 0 && (
                        <span className="text-xs text-muted-foreground truncate pr-2 mt-0.5 opacity-80">
                          {active.slice(0, 3).map(i => i.title).join(", ")}
                          {active.length > 3 && " ..."}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setPopup({ type: 'CONFIRM_DELETE', folderId: folder.id })}
                    className="text-muted-foreground hover:text-danger active:bg-chrome p-1.5 rounded-full transition-colors ml-2"
                  >
                    <IconTrash size={16} stroke={2} />
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="flex-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <ItemRows items={active} onToggle={onToggleDone} onDelete={onDelete} onEdit={onEdit} onMove={handleMove} onSelect={onSelect} members={members} comments={comments} userId={userId} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Default Folder (formerly unassigned) */}
          <div className={clsx("flex flex-col px-4 transition-all", collapsed["unassigned"] ? "py-2.5" : "py-3")}>
            <div className={clsx("flex items-center justify-between transition-all", !collapsed["unassigned"] ? "mb-3 border-b border-border/40 pb-2" : "")}>
              <div className="flex items-center gap-2 flex-1 overflow-hidden">
                <button onClick={() => toggleCollapse("unassigned")} className="text-muted-foreground hover:text-foreground active:scale-90 transition-transform p-1">
                  {collapsed["unassigned"] ? <IconChevronRight size={18}/> : <IconChevronDown size={18}/>}
                </button>
                <div className="flex flex-col flex-1 min-w-0" onClick={() => toggleCollapse("unassigned")}>
                  <h3 className="text-base font-extrabold flex items-center gap-2 text-foreground cursor-pointer truncate">
                    <span className="text-muted-foreground"><IconFolder size={18} /></span> {t("grocery.defaultFolder")} <span className="text-muted-foreground font-normal text-sm">({unassigned.filter(i => !i.done).length})</span>
                  </h3>
                  {collapsed["unassigned"] && unassigned.filter(i => !i.done).length > 0 && (
                    <span className="text-xs text-muted-foreground truncate pr-2 mt-0.5 opacity-80">
                      {unassigned.filter(i => !i.done).slice(0, 3).map(i => i.title).join(", ")}
                      {unassigned.filter(i => !i.done).length > 3 && " ..."}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!collapsed["unassigned"] && (
              <div className="flex-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <ItemRows items={unassigned.filter(i => !i.done)} onToggle={onToggleDone} onDelete={onDelete} onEdit={onEdit} onMove={handleMove} onSelect={onSelect} members={members} comments={comments} userId={userId} />
              </div>
            )}
          </div>
        </div>

        {/* Add Folder Button in Center */}
        <div className="flex justify-center">
          <button
            onClick={handleCreateFolderClick}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors bg-surface px-5 py-2.5 rounded-full border border-border/60 shadow-sm active:scale-95"
          >
            <IconPlus size={16} stroke={2.5} /> {t("grocery.addFolder")}
          </button>
        </div>

        {/* Archive: purchased + deleted — a second, quieter grouped surface */}
        <div className="flex flex-col rounded-2xl bg-surface shadow-sm border border-border/40 divide-y divide-border/40">
          {purchasedItems.length > 0 && (
            <div className={clsx("flex flex-col px-4 transition-all", collapsed["done_folder"] ? "py-2.5" : "py-3")}>
              <div className={clsx("flex items-center justify-between transition-all", !collapsed["done_folder"] ? "mb-3 border-b border-border/40 pb-2" : "")}>
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                  <button onClick={() => toggleCollapse("done_folder")} className="text-muted-foreground hover:text-foreground active:scale-90 transition-transform p-1">
                    {collapsed["done_folder"] ? <IconChevronRight size={18}/> : <IconChevronDown size={18}/>}
                  </button>
                  <div className="flex flex-col flex-1 min-w-0" onClick={() => toggleCollapse("done_folder")}>
                    <h3 className="text-base font-extrabold flex items-center gap-2 text-muted-foreground cursor-pointer truncate">
                      <IconCheck size={18} /> {t("grocery.purchased")} <span className="font-normal text-sm">({purchasedItems.length})</span>
                    </h3>
                  </div>
                </div>
              </div>
              {!collapsed["done_folder"] && (
                <div className="flex-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <ItemRows items={purchasedItems} onToggle={onToggleDone} onDelete={onDelete} onEdit={onEdit} onMove={handleMove} onSelect={onSelect} members={members} comments={comments} userId={userId} />
                </div>
              )}
            </div>
          )}

          <div className={clsx("flex flex-col px-4 transition-all", collapsed["deleted_folder"] ? "py-2.5" : "py-3")}>
            <div className={clsx("flex items-center justify-between transition-all", !collapsed["deleted_folder"] ? "mb-3 border-b border-border/40 pb-2" : "")}>
              <button
                onClick={() => setCollapsed(prev => ({ ...prev, "deleted_folder": !prev["deleted_folder"] }))}
                className="flex items-center gap-2 flex-1 text-left p-1 -m-1"
              >
                <IconTrash size={18} className="text-muted-foreground" />
                <h3 className="text-base font-extrabold flex items-center gap-2 text-muted-foreground">
                  {t("grocery.deletedSection")} <span className="font-normal text-sm">({deletedItems.length})</span>
                </h3>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">{t("grocery.autoDeleteNote")}</span>
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
                  <p className="text-xs text-muted-foreground text-center py-4">{t("grocery.noDeletedItems")}</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {deletedItems.map(item => (
                      <li key={item.id} className="flex items-center gap-3 py-3">
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground line-through decoration-muted-foreground/30">{item.title}</span>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => onRestore(item.id)}
                            className="inline-flex min-h-8 items-center justify-center rounded-lg border border-border/80 px-3 text-xs font-bold text-muted-foreground transition-all hover:bg-chrome active:scale-95"
                          >
                            {t("grocery.restore")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(t("grocery.confirmHardDelete"))) onHardDelete(item.id);
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
          </div>
        </div>
      </div>

      {/* Popups */}
      {popup.type !== 'NONE' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-200">

            {popup.type === 'CREATE_FOLDER' && (
              <>
                <h3 className="font-bold text-lg">{t("grocery.newFolderTitle")}</h3>
                <input
                  autoFocus
                  className="w-full bg-chrome rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={t("grocery.folderNamePlaceholder")}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmPopup()}
                />
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>{t("common.cancel")}</button>
                  <button className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground" onClick={handleConfirmPopup}>{t("common.add")}</button>
                </div>
              </>
            )}

            {popup.type === 'CHANGE_ICON' && (
              <>
                <h3 className="font-bold text-lg mb-2">{t("grocery.changeIconTitle")}</h3>
                <div className="grid grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1 scrollbar-hide">
                  {["📁", "🛒", "🍗", "🥦", "🍎", "🧀", "🍞", "🍦", "🍷", "🐟", "📦", "💊", "🧼", "🍼", "💧", "☕", "🎂", "🍽", "🔪", "🥩", "🎉", "🔥", "🏠", "💡", "💰"].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        saveFolders(folders.map(f => f.id === popup.folderId ? { ...f, icon: emoji } : f));
                        setPopup({ type: 'NONE' });
                      }}
                      className="text-3xl hover:scale-110 active:scale-90 transition-transform flex items-center justify-center p-2 rounded-xl hover:bg-chrome"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>{t("common.close")}</button>
                </div>
              </>
            )}

            {popup.type === 'CONFIRM_DELETE' && (
              <>
                <h3 className="font-bold text-lg text-danger">{t("grocery.deleteFolderTitle")}</h3>
                <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
                  {t("grocery.deleteFolderDesc")}
                </p>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>{t("common.cancel")}</button>
                  <button className="flex-1 py-3 rounded-xl font-bold bg-danger text-danger-foreground" onClick={handleConfirmPopup}>{t("common.delete")}</button>
                </div>
              </>
            )}

            {popup.type === 'MOVE_ITEM' && (
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-lg mb-1">{t("grocery.selectMoveFolder")}</h3>
                <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                  <button
                    className="flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-chrome hover:bg-border/50 font-medium transition-colors"
                    onClick={() => {
                      editItem(popup.item.id, popup.item.title, "");
                      showToast(t("grocery.movedToUnsorted"));
                      setPopup({ type: 'NONE' });
                    }}
                  >
                    <span className="text-xl">📁</span> {t("grocery.unsorted")}
                  </button>
                  {folders.map(f => (
                    <button
                      key={f.id}
                      className="flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-chrome hover:bg-border/50 font-medium transition-colors"
                      onClick={() => {
                        editItem(popup.item.id, popup.item.title, f.id);
                        showToast(t("grocery.movedToFolder", { name: f.name }));
                        setPopup({ type: 'NONE' });
                      }}
                    >
                      <span className="text-xl">{f.icon}</span> {f.name}
                    </button>
                  ))}
                </div>
                <button className="mt-2 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>{t("common.cancel")}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
