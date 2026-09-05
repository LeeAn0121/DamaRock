import { useState, useMemo } from "react";
import type { Item, Member } from "./data";
import { IconFolder, IconPlus, IconTrash, IconChevronDown, IconChevronRight, IconCheck } from "@tabler/icons-react";
import { ItemRows, DoneDisclosure } from "./HomeList";
import { showToast } from "./components/Toast";
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
}) {
  const [popup, setPopup] = useState<PopupState>({ type: 'NONE' });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [inputValue, setInputValue] = useState("");

  const systemItem = items.find((i) => i.title === "__SYSTEM_FOLDERS__");
  const groceryItems = items.filter((i) => i.category === "grocery" && i.title !== "__SYSTEM_FOLDERS__");
  
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
        showToast("폴더 이름을 입력해주세요.");
        return;
      }
      saveFolders([...folders, { id: Date.now().toString(), name: inputValue.trim(), icon: "📁" }]);
      showToast("새 폴더가 추가되었습니다.");
      setPopup({ type: 'NONE' });
      setInputValue("");
    } else if (popup.type === 'CHANGE_ICON') {
      if (!inputValue.trim()) {
        showToast("아이콘(이모지)을 입력해주세요.");
        return;
      }
      const newFolders = folders.map(f => f.id === popup.folderId ? { ...f, icon: inputValue.trim() } : f);
      saveFolders(newFolders);
      showToast("아이콘이 변경되었습니다.");
      setPopup({ type: 'NONE' });
      setInputValue("");
    } else if (popup.type === 'CONFIRM_DELETE') {
      saveFolders(folders.filter(f => f.id !== popup.folderId));
      showToast("폴더가 삭제되었습니다.");
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
      const folderId = item.meta;
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
      showToast("생성된 폴더가 없습니다. 먼저 폴더를 추가해주세요.");
      return;
    }
    setPopup({ type: 'MOVE_ITEM', item });
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center px-2 mt-4">
        <h2 className="text-sm font-bold text-muted-foreground">장보기 항목 ({groceryItems.filter(i => !i.done).length})</h2>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {folders.map(folder => {
          const folderItems = grouped.get(folder.id) || [];
          const active = folderItems.filter(i => !i.done);
          const done = folderItems.filter(i => i.done);
          const isCollapsed = collapsed[folder.id];
          
          return (
            <section key={folder.id} className={clsx("flex flex-col rounded-2xl bg-surface px-4 shadow-sm border border-border/40 transition-all", isCollapsed ? "py-2.5" : "py-3")}>
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
                    title="아이콘 변경"
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
            </section>
          );
        })}

        {/* Default Folder (formerly unassigned) */}
        <section className={clsx("flex flex-col rounded-2xl bg-surface px-4 shadow-sm border border-border/40 transition-all", collapsed["unassigned"] ? "py-2.5" : "py-3")}>
          <div className={clsx("flex items-center justify-between transition-all", !collapsed["unassigned"] ? "mb-3 border-b border-border/40 pb-2" : "")}>
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <button onClick={() => toggleCollapse("unassigned")} className="text-muted-foreground hover:text-foreground active:scale-90 transition-transform p-1">
                {collapsed["unassigned"] ? <IconChevronRight size={18}/> : <IconChevronDown size={18}/>}
              </button>
              <div className="flex flex-col flex-1 min-w-0" onClick={() => toggleCollapse("unassigned")}>
                <h3 className="text-base font-extrabold flex items-center gap-2 text-foreground cursor-pointer truncate">
                  <span className="text-muted-foreground"><IconFolder size={18} /></span> 기본 폴더 <span className="text-muted-foreground font-normal text-sm">({unassigned.filter(i => !i.done).length})</span>
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
        </section>

        {/* Add Folder Button in Center */}
        <div className="flex justify-center py-4">
          <button 
            onClick={() => { setInputValue(''); setPopup({ type: 'CREATE_FOLDER' }); }}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors bg-surface px-5 py-2.5 rounded-full border border-border/60 shadow-sm active:scale-95"
          >
            <IconPlus size={16} stroke={2.5} /> 새 폴더 추가
          </button>
        </div>

        {/* Done Folder (Aggregated) */}
        {items.filter(i => i.done).length > 0 && (
          <section className={clsx("flex flex-col rounded-2xl bg-surface px-4 shadow-sm border border-border/40 transition-all opacity-70", collapsed["done_folder"] ? "py-2.5" : "py-3")}>
            <div className={clsx("flex items-center justify-between transition-all", !collapsed["done_folder"] ? "mb-3 border-b border-border/40 pb-2" : "")}>
              <div className="flex items-center gap-2 flex-1 overflow-hidden">
                <button onClick={() => toggleCollapse("done_folder")} className="text-muted-foreground hover:text-foreground active:scale-90 transition-transform p-1">
                  {collapsed["done_folder"] ? <IconChevronRight size={18}/> : <IconChevronDown size={18}/>}
                </button>
                <div className="flex flex-col flex-1 min-w-0" onClick={() => toggleCollapse("done_folder")}>
                  <h3 className="text-base font-extrabold flex items-center gap-2 text-foreground cursor-pointer truncate">
                    <span className="text-muted-foreground"><IconCheck size={18} /></span> 구매완료 <span className="text-muted-foreground font-normal text-sm">({items.filter(i => i.done).length})</span>
                  </h3>
                </div>
              </div>
            </div>
            {!collapsed["done_folder"] && (
              <div className="flex-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <ItemRows items={items.filter(i => i.done)} onToggle={onToggleDone} onDelete={onDelete} onEdit={onEdit} onMove={handleMove} onSelect={onSelect} members={members} comments={comments} userId={userId} />
              </div>
            )}
          </section>
        )}

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

      </div>

      {/* Popups */}
      {popup.type !== 'NONE' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            
            {popup.type === 'CREATE_FOLDER' && (
              <>
                <h3 className="font-bold text-lg">새 폴더</h3>
                <input 
                  autoFocus
                  className="w-full bg-chrome rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50" 
                  placeholder="폴더 이름"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmPopup()}
                />
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>취소</button>
                  <button className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground" onClick={handleConfirmPopup}>추가</button>
                </div>
              </>
            )}

            {popup.type === 'CHANGE_ICON' && (
              <>
                <h3 className="font-bold text-lg">아이콘 변경</h3>
                <input 
                  autoFocus
                  className="w-full bg-chrome rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-2xl text-center" 
                  placeholder="이모지 입력"
                  maxLength={5}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmPopup()}
                />
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>취소</button>
                  <button className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground" onClick={handleConfirmPopup}>변경</button>
                </div>
              </>
            )}

            {popup.type === 'CONFIRM_DELETE' && (
              <>
                <h3 className="font-bold text-lg text-danger">폴더 삭제</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  폴더를 삭제하시겠습니까?<br/>안에 있는 항목은 '미분류'로 이동됩니다.
                </p>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>취소</button>
                  <button className="flex-1 py-3 rounded-xl font-bold bg-danger text-danger-foreground" onClick={handleConfirmPopup}>삭제</button>
                </div>
              </>
            )}

            {popup.type === 'MOVE_ITEM' && (
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-lg mb-1">이동할 폴더 선택</h3>
                <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                  <button 
                    className="flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-chrome hover:bg-border/50 font-medium transition-colors"
                    onClick={() => {
                      editItem(popup.item.id, popup.item.title, "");
                      showToast("미분류로 이동되었습니다.");
                      setPopup({ type: 'NONE' });
                    }}
                  >
                    <span className="text-xl">📁</span> 미분류
                  </button>
                  {folders.map(f => (
                    <button 
                      key={f.id}
                      className="flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-chrome hover:bg-border/50 font-medium transition-colors"
                      onClick={() => {
                        editItem(popup.item.id, popup.item.title, f.id);
                        showToast(`'${f.name}' 폴더로 이동되었습니다.`);
                        setPopup({ type: 'NONE' });
                      }}
                    >
                      <span className="text-xl">{f.icon}</span> {f.name}
                    </button>
                  ))}
                </div>
                <button className="mt-2 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>취소</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
