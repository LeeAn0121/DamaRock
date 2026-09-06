import { useState, useRef } from "react";
import clsx from "clsx";
import { IconCheck, IconFolder, IconEdit, IconTrash, IconChevronDown } from "@tabler/icons-react";
import type { Item, Member } from "./data";
import { memberName } from "./data";
import { useI18n } from "./lib/i18n";

const SWIPE_REVEAL = 76;
const SWIPE_COMMIT_THRESHOLD = 40;

export function ActionableItem({
  item,
  members,
  comments = [],
  userId,
  onToggle,
  onDelete,
  onLongPress,
  onSelect,
  index = 0,
}: {
  item: Item;
  members: Member[];
  comments?: import("./data").Comment[];
  userId?: string | null;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onLongPress?: (item: Item) => void;
  onSelect?: (item: Item) => void;
  index?: number;
}) {
  const { t } = useI18n();
  const timerRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  // "스와이프로 삭제/완료" setting: swipe the row itself to reveal a
  // complete/delete shortcut, instead of tapping to open the full action
  // sheet. Read directly from localStorage (same pattern as other
  // preference reads elsewhere) rather than threading a prop through every
  // list ancestor for one boolean.
  const swipeEnabled = typeof localStorage !== "undefined" && localStorage.getItem("swipeAction") === "true";

  const [dragX, setDragX] = useState(0);
  const dragState = useRef<{ startX: number; startY: number; dragging: boolean; axisLocked: "x" | "y" | null }>({
    startX: 0,
    startY: 0,
    dragging: false,
    axisLocked: null,
  });

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
    if (dragX !== 0) {
      setDragX(0);
      return;
    }
    onSelect?.(item);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    cancelPress();
    onLongPress?.(item);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startPress();
    if (!swipeEnabled) return;
    const touch = e.targetTouches[0];
    dragState.current = { startX: touch.clientX, startY: touch.clientY, dragging: false, axisLocked: null };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeEnabled) {
      cancelPress();
      return;
    }
    const touch = e.targetTouches[0];
    const dx = touch.clientX - dragState.current.startX;
    const dy = touch.clientY - dragState.current.startY;

    if (!dragState.current.axisLocked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // too small to tell yet
      dragState.current.axisLocked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (dragState.current.axisLocked === "y") return; // vertical scroll — don't hijack it

    dragState.current.dragging = true;
    cancelPress();
    const clamped = Math.max(-SWIPE_REVEAL, Math.min(SWIPE_REVEAL, dx));
    setDragX(clamped);
  };

  const handleTouchEnd = () => {
    cancelPress();
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    if (dragX <= -SWIPE_COMMIT_THRESHOLD) {
      setDragX(-SWIPE_REVEAL);
    } else if (dragX >= SWIPE_COMMIT_THRESHOLD) {
      setDragX(SWIPE_REVEAL);
    } else {
      setDragX(0);
    }
  };

  const itemComments = comments.filter(c => c.item_id === item.id);

  return (
    <li
      className="group relative flex flex-col border-b border-border/40 last:border-0 bg-surface select-none overflow-hidden animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms`, animationDuration: "300ms" }}
      onContextMenu={handleContextMenu}
    >
      {swipeEnabled && (
        <>
          <button
            type="button"
            aria-label={t("itemRows.swipeComplete")}
            onClick={() => { onToggle(item.id); setDragX(0); }}
            className="absolute inset-y-0 left-0 flex items-center justify-center bg-success text-success-foreground"
            style={{ width: SWIPE_REVEAL }}
          >
            <IconCheck size={20} stroke={2.5} />
          </button>
          {onDelete && (
            <button
              type="button"
              aria-label={t("itemRows.swipeDelete")}
              onClick={() => { onDelete(item.id); setDragX(0); }}
              className="absolute inset-y-0 right-0 flex items-center justify-center bg-danger text-white"
              style={{ width: SWIPE_REVEAL }}
            >
              <IconTrash size={20} stroke={2.5} />
            </button>
          )}
        </>
      )}
      <div
        className={clsx(
          "relative z-10 flex min-w-0 items-center py-3 px-4 bg-surface cursor-pointer sm:hover:bg-chrome/40",
          isActive ? "bg-chrome/60" : "",
          dragState.current.dragging ? "" : "transition-transform duration-200"
        )}
        style={swipeEnabled ? { transform: `translateX(${dragX}px)` } : undefined}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
            {item.addedBy === userId ? t("common.me") : memberName(members, item.addedBy)}
          </span>
        </span>
        {itemComments.length > 0 && (
          <div className="shrink-0 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
            {t("common.comments", { n: itemComments.length })}
          </div>
        )}
      </div>
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
  const { t } = useI18n();
  const [actionItem, setActionItem] = useState<Item | null>(null);

  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{t("itemRows.empty")}</p>;
  }
  return (
    <>
      <ul className="divide-y divide-border/60">
        {items.map((item, index) => (
          <ActionableItem
            key={item.id}
            item={item}
            index={index}
            members={members}
            comments={comments}
            userId={userId}
            onToggle={onToggle}
            onDelete={onDelete}
            onLongPress={setActionItem}
            onSelect={onSelect}
          />
        ))}
      </ul>

      {/* Action Popup — only exists in the DOM while open, so there's nothing
          to briefly show/hide on mount (it used to be always-mounted and
          CSS-toggled, which could flash open for a frame on page load). */}
      {actionItem && (
        <>
          <div
            className="fixed inset-0 z-[120] animate-in fade-in bg-black/40 backdrop-blur-sm duration-200"
            onClick={() => setActionItem(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[130] flex max-h-[85dvh] animate-in slide-in-from-bottom-full flex-col rounded-t-3xl bg-background shadow-2xl duration-300 ease-out sm:mx-auto sm:max-w-md pb-safe">
            <div className="flex h-1.5 w-full items-center justify-center pt-3 pb-4">
              <div className="h-1.5 w-10 rounded-full bg-border/60" />
            </div>
            <div className="px-6 pb-4">
              <h3 className="text-lg font-bold text-foreground mb-4 truncate">{actionItem.title}</h3>
              <div className="flex flex-col gap-2">
                {onMove && (
                  <button
                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-surface hover:bg-chrome active:scale-95 transition-all text-left font-medium"
                    onClick={() => { onMove(actionItem); setActionItem(null); }}
                  >
                    <IconFolder size={20} className="text-muted-foreground" />
                    {t("itemRows.move")}
                  </button>
                )}
                {onEdit && (
                  <button
                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-surface hover:bg-chrome active:scale-95 transition-all text-left font-medium"
                    onClick={() => { onEdit(actionItem); setActionItem(null); }}
                  >
                    <IconEdit size={20} className="text-primary" />
                    {t("itemRows.editItem")}
                  </button>
                )}
                {onDelete && (
                  <button
                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-danger/10 hover:bg-danger/20 active:scale-95 transition-all text-left font-medium text-danger"
                    onClick={() => { onDelete(actionItem.id); setActionItem(null); }}
                  >
                    <IconTrash size={20} />
                    {t("itemRows.deleteItem")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
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
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border-t border-border/40 pt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mb-2 flex w-full items-center justify-between text-sm font-bold text-muted-foreground"
      >
        <span>{t("itemRows.done", { n: count })}</span>
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
