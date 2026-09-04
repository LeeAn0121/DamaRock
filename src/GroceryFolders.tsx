import { useState, useMemo } from "react";
import type { Item, Member } from "./data";
import { IconFolder, IconPlus, IconTrash } from "@tabler/icons-react";
import { ItemRows, DoneDisclosure } from "./HomeList";

export type Folder = { id: string; name: string; icon: string };

export default function GroceryFolders({
  items,
  members,
  onToggleDone,
  onDelete,
  onEdit,
  onSelect,
  addItem,
  editItem,
}: {
  items: Item[];
  members: Member[];
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
  onSelect: (item: Item) => void;
  addItem: (item: Pick<Item, "title" | "category" | "meta">) => void;
  editItem: (id: string, title: string, meta?: string | null) => void;
}) {
  const groceryItems = items.filter((i) => i.category === "grocery");
  const systemItem = items.find((i) => i.category === "system" && i.title === "folders");
  
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
      editItem(systemItem.id, "folders", meta);
    } else {
      addItem({ title: "folders", category: "system", meta });
    }
  };

  const handleCreateFolder = () => {
    const icon = window.prompt("폴더 아이콘(이모지)을 입력하세요:", "🛒");
    if (!icon) return;
    const name = window.prompt("폴더 이름을 입력하세요:", "새 폴더");
    if (!name) return;
    saveFolders([...folders, { id: Date.now().toString(), name, icon }]);
  };

  const handleDeleteFolder = (folderId: string) => {
    if (!window.confirm("폴더를 삭제하시겠습니까? (안에 있는 항목은 '미분류'로 이동됩니다)")) return;
    saveFolders(folders.filter(f => f.id !== folderId));
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
      window.alert("생성된 폴더가 없습니다. 먼저 폴더를 추가해주세요.");
      return;
    }
    const folderList = folders.map((f, i) => `${i + 1}. ${f.icon} ${f.name}`).join("\n");
    const num = window.prompt(`이동할 폴더 번호를 선택하세요 (비워두면 미분류):\n${folderList}`);
    if (num === null) return;
    
    const index = parseInt(num) - 1;
    const targetFolder = folders[index];
    const newMeta = targetFolder ? targetFolder.id : "";
    
    editItem(item.id, item.title, newMeta);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center px-2 mt-4">
        <h2 className="text-sm font-bold text-muted-foreground">장보기 항목 ({groceryItems.filter(i => !i.done).length})</h2>
        <button onClick={handleCreateFolder} className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
          <IconPlus size={14} stroke={2.5} /> 새 폴더
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map(folder => {
          const folderItems = grouped.get(folder.id) || [];
          const active = folderItems.filter(i => !i.done);
          const done = folderItems.filter(i => i.done);
          
          return (
            <section key={folder.id} className="flex flex-col rounded-2xl bg-surface px-4 py-3 shadow-sm border border-border/40">
              <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                <h3 className="text-base font-extrabold flex items-center gap-2 text-foreground">
                  <span className="text-xl">{folder.icon}</span> {folder.name} <span className="text-muted-foreground font-normal text-sm">({active.length})</span>
                </h3>
                <button onClick={() => handleDeleteFolder(folder.id)} className="text-muted-foreground hover:text-danger active:bg-chrome p-1.5 rounded-full transition-colors">
                  <IconTrash size={16} stroke={2} />
                </button>
              </div>
              
              <div className="flex-1">
                <ItemRows items={active} onToggle={onToggleDone} onDelete={onDelete} onEdit={onEdit} onMove={handleMove} onSelect={onSelect} members={members} />
                {done.length > 0 && (
                  <DoneDisclosure count={done.length}>
                    <ItemRows items={done} onToggle={onToggleDone} onDelete={onDelete} onEdit={onEdit} onMove={handleMove} onSelect={onSelect} members={members} />
                  </DoneDisclosure>
                )}
              </div>
            </section>
          );
        })}

        {(unassigned.length > 0 || folders.length === 0) && (
          <section className="flex flex-col rounded-2xl bg-surface px-4 py-3 shadow-sm border border-border/40">
            <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-foreground">
                <span className="text-muted-foreground"><IconFolder size={18} /></span> 미분류 <span className="text-muted-foreground font-normal text-sm">({unassigned.filter(i => !i.done).length})</span>
              </h3>
            </div>
            <div className="flex-1">
              <ItemRows items={unassigned.filter(i => !i.done)} onToggle={onToggleDone} onDelete={onDelete} onEdit={onEdit} onMove={handleMove} onSelect={onSelect} members={members} />
              {unassigned.some((i) => i.done) && (
                <DoneDisclosure count={unassigned.filter(i => i.done).length}>
                  <ItemRows items={unassigned.filter((i) => i.done)} onToggle={onToggleDone} onDelete={onDelete} onEdit={onEdit} onMove={handleMove} onSelect={onSelect} members={members} />
                </DoneDisclosure>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
