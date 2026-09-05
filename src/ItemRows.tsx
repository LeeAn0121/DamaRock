import { useState, useRef } from "react";
import clsx from "clsx";
import { IconCheck, IconFolder, IconEdit, IconTrash, IconChevronDown } from "@tabler/icons-react";
import type { Item, Member } from "./data";
import { memberName } from "./data";

export function ActionableItem({
  item,
  members,
  comments = [],
  userId,
  onToggle,
  onLongPress,
  onSelect,
}: {
  item: Item;
  members: Member[];
  comments?: import("./data").Comment[];
  userId?: string | null;
  onToggle: (id: string) => void;
  onLongPress?: (item: Item) => void;
  onSelect?: (item: Item) => void;
}) {
  const timerRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startPress = () => {
    setIsActive(true);
    timerRef.current = window.setTimeout(() => {
      setIsActive(false);
      onLongPress?.(item);
    }, 500);
  };

  const cancelPress = () => {
    setIsActive(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    cancelPress();
    onSelect?.(item);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    cancelPress();
    onLongPress?.(item);
  };

  const itemComments = comments.filter(c => c.item_id === item.id);

  return (
    <li 
      className="group relative flex flex-col border-b border-border/40 last:border-0 bg-surface select-none overflow-hidden"
      onContextMenu={handleContextMenu}
    >
      <div 
        className={clsx(
          "relative z-10 flex min-w-0 items-center py-3 px-4 bg-surface transition-colors duration-200 cursor-pointer sm:hover:bg-chrome/40",
          isActive ? "bg-chrome/60" : ""
        )}
        onClick={handleClick}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); cancelPress(); onToggle(item.id); }}
          className={clsx(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors mr-3",
            item.done ? "border-2 border-primary bg-primary text-primary-foreground" : "border-2 border-border text-transparent"
          )}
        >
          {item.done && <IconCheck size={13} stroke={3} />}
        </button>
        <span className="min-w-0 flex-1 pr-2" data-meta={item.meta || undefined}>
          <span className={clsx("block truncate text-base", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
            {item.title}
          </span>
          <span className="block text-xs text-muted-foreground">
            {item.addedBy === userId ? "나" : memberName(members, item.addedBy)}
          </span>
        </span>
        {itemComments.length > 0 && (
          <div className="shrink-0 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
            댓글 {itemComments.length}
          </div>
        )}
      </div>

      {itemComments.length > 0 && (
        <div className="flex flex-col gap-2 pb-3 px-12 relative z-10">
          {itemComments.map(c => {
            const isMe = c.author_id === userId;
            return (
              <div key={c.id} className={clsx("px-3 py-2 rounded-2xl text-[13px] leading-tight max-w-[90%]", isMe ? "bg-primary/10 text-foreground self-end rounded-tr-sm" : "bg-chrome text-foreground self-start rounded-tl-sm")}>
                <span className={clsx("block text-[10px] font-bold mb-0.5", isMe ? "text-primary text-right" : "text-muted-foreground")}>
                  {isMe ? "나" : memberName(members, c.author_id)}
                </span>
                {c.content}
              </div>
            );
          })}
        </div>
      )}
    </li>
  );
}

export function ItemRows({
  items,
  members,
  comments = [],
  userId,
  onToggle,
  onDelete,
  onEdit,
  onMove,
  onSelect,
}: {
  items: Item[];
  members: Member[];
  comments?: import("./data").Comment[];
  userId?: string | null;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: Item) => void;
  onMove?: (item: Item) => void;
  onSelect?: (item: Item) => void;
}) {
  const [actionItem, setActionItem] = useState<Item | null>(null);

  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">모두 담아뒀어요</p>;
  }
  return (
    <>
      <ul className="divide-y divide-border/60">
        {items.map((item) => (
          <ActionableItem 
            key={item.id} 
            item={item} 
            members={members}
            comments={comments}
            userId={userId}
            onToggle={onToggle} 
            onLongPress={setActionItem}
            onSelect={onSelect}
          />
        ))}
      </ul>
      
      {/* Action Popup */}
      <div
        className={clsx(
          "fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          actionItem ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setActionItem(null)}
      />
      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 z-[130] flex max-h-[85dvh] flex-col rounded-t-3xl bg-background shadow-2xl transition-transform duration-300 ease-out sm:mx-auto sm:max-w-md pb-safe",
          actionItem ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex h-1.5 w-full items-center justify-center pt-3 pb-4">
          <div className="h-1.5 w-10 rounded-full bg-border/60" />
        </div>
        <div className="px-6 pb-4">
          <h3 className="text-lg font-bold text-foreground mb-4 truncate">{actionItem?.title}</h3>
          <div className="flex flex-col gap-2">
            {onMove && (
              <button
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-surface hover:bg-chrome active:scale-95 transition-all text-left font-medium"
                onClick={() => { if(actionItem) onMove(actionItem); setActionItem(null); }}
              >
                <IconFolder size={20} className="text-muted-foreground" />
                폴더 이동
              </button>
            )}
            {onEdit && (
              <button
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-surface hover:bg-chrome active:scale-95 transition-all text-left font-medium"
                onClick={() => { if(actionItem) onEdit(actionItem); setActionItem(null); }}
              >
                <IconEdit size={20} className="text-primary" />
                항목 수정
              </button>
            )}
            {onDelete && (
              <button
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-danger/10 hover:bg-danger/20 active:scale-95 transition-all text-left font-medium text-danger"
                onClick={() => { if(actionItem) onDelete(actionItem.id); setActionItem(null); }}
              >
                <IconTrash size={20} />
                항목 삭제
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function DoneDisclosure({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border-t border-border/40 pt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mb-2 flex w-full items-center justify-between text-sm font-bold text-muted-foreground"
      >
        <span>담음 ({count})</span>
        <IconChevronDown
          size={16}
          stroke={2.5}
          className={clsx("transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && children}
    </div>
  );
}
