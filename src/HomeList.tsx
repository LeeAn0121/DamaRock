import { useMemo, useState } from "react";
import clsx from "clsx";
import { IconCheck, IconChecklist, IconChevronDown, IconInbox, IconPackage, IconPlus, IconSettings, IconShoppingCart, IconWifiOff, IconFolder, IconEdit, IconTrash } from "@tabler/icons-react";
import { memberName, type Category, type Item, type Member } from "./data";
import ActivitySheet from "./ActivitySheet";
import CalendarView from "./CalendarView";
import ItemDetailSheet from "./ItemDetailSheet";
import GroceryFolders from "./GroceryFolders";
import { useInstallPrompt } from "./hooks/useInstallPrompt";

type ViewState = "normal" | "empty" | "loading" | "error";

function useUrlState(): ViewState {
  if (typeof window === "undefined") return "normal";
  const v = new URLSearchParams(window.location.search).get("state");
  if (v === "empty" || v === "loading" || v === "error") return v;
  return "normal";
}

export default function HomeList(props: {
  items: Item[];
  members: Member[];
  userId: string | null;
  familyId: string | null;
  onToggleDone: (id: string) => void;
  onAssignCategory: (id: string, category: Category) => void;
  onQuickAdd: (title: string) => void;
  addItem: (item: Pick<Item, "title" | "category" | "meta">) => void;
  editItem: (id: string, title: string, meta?: string | null) => void;
  moveItems: (ids: string[], target: Category) => void;
  onOpenAddSheet: () => void;
  onOpenSettings: () => void;
  deleteItem: (id: string) => void;
}) {
  const {
    items,
    members,
    userId,
    familyId,
    onToggleDone,
    onAssignCategory,
    onQuickAdd,
    addItem,
    editItem,
    moveItems,
    onOpenAddSheet,
    onOpenSettings,
    deleteItem,
  } = props;
  const viewState = useUrlState();
  const [currentTab, setCurrentTab] = useState<"grocery" | "todo">("grocery");
  
  const { isInstallable, promptInstall } = useInstallPrompt();
  const [showDoneGrocery, setShowDoneGrocery] = useState(false);
  const [showDoneTodo, setShowDoneTodo] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleEdit = (item: Item) => {
    const newTitle = window.prompt("수정할 내용을 입력하세요:", item.title);
    if (newTitle && newTitle.trim() !== item.title) {
      editItem(item.id, newTitle.trim());
    }
  };

  const handleEditTodo = (item: Item) => {
    const newTitle = window.prompt("할 일을 수정하세요:", item.title);
    if (newTitle === null) return;
    const newDate = window.prompt("날짜를 수정하세요 (YYYY-MM-DD):", item.meta || "");
    if (newDate === null) return;
    
    if (newTitle.trim() !== item.title || newDate.trim() !== item.meta) {
      editItem(item.id, newTitle.trim(), newDate.trim());
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("항목 삭제 시, 달린 댓글도 모두 삭제됩니다. 그래도 삭제하시겠습니까?")) {
      deleteItem(id);
    }
  };

  const activeItems = viewState === "empty" ? [] : items.filter(i => i.title !== "__SYSTEM_FOLDERS__");
  const inbox = activeItems.filter((i) => i.category === "inbox");
  const grocery = activeItems.filter((i) => i.category === "grocery");
  const todo = activeItems.filter((i) => i.category === "todo");

  const remaining = activeItems.filter((i) => !i.done).length;
  const doneToday = activeItems.filter((i) => i.done).length;

  const summaryLine = useMemo(() => {
    const groceryLeft = grocery.filter((i) => !i.done).length;
    const todoLeft = todo.filter((i) => !i.done).length;
    return `장보기 ${groceryLeft} · 할 일 ${todoLeft}`;
  }, [grocery, todo]);

  if (viewState === "loading") {
    return <LoadingState />;
  }

  if (viewState === "error") {
    return <ErrorState />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans text-foreground pb-24">
      <div className="mx-auto flex min-h-dvh w-full max-w-md md:max-w-3xl lg:max-w-5xl flex-col relative">
        {/* Standard nav bar */}
        <header className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="로고" className="h-6 w-6 rounded-md shadow-sm" />
            <span className="text-xl font-extrabold tracking-tight text-primary">담아락</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {members.map((m, idx) => (
                <div
                  key={m.id}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-chrome text-xs font-bold text-chrome-foreground overflow-hidden shadow-sm"
                  style={{ zIndex: members.length - idx }}
                >
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    m.initial
                  )}
                  {m.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background bg-success z-10" />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="소식"
              onClick={() => setActivityOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            <button
              type="button"
              aria-label="설정"
              onClick={onOpenSettings}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
            >
              <IconSettings size={22} stroke={2} />
            </button>
          </div>
        </header>

        {isInstallable && (
          <div className="bg-primary/10 px-5 py-3 flex items-center justify-between border-b border-primary/20">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary">담아락 앱 설치하기</span>
              <span className="text-xs text-primary/80 font-medium mt-0.5">홈 화면에 추가하고 더 빠르게 사용하세요!</span>
            </div>
            <button
              onClick={promptInstall}
              className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              설치
            </button>
          </div>
        )}

        {/* Tabs - Fixed below header */}
        <div className="sticky top-0 z-20 flex gap-2 overflow-x-auto scrollbar-hide bg-background/95 backdrop-blur-md px-5 py-3 border-b border-border/40 shadow-sm">
          <button
            type="button"
            onClick={() => setCurrentTab("grocery")}
            className={clsx(
              "flex-1 whitespace-nowrap rounded-xl py-2.5 text-[15px] font-bold shadow-sm transition-all active:scale-[0.98]",
              currentTab === "grocery" 
                ? "bg-foreground text-background" 
                : "bg-surface text-muted-foreground border border-border/60 hover:bg-chrome"
            )}
          >
            장보기
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("todo")}
            className={clsx(
              "flex-1 whitespace-nowrap rounded-xl py-2.5 text-[15px] font-bold shadow-sm transition-all active:scale-[0.98]",
              currentTab === "todo" 
                ? "bg-foreground text-background" 
                : "bg-surface text-muted-foreground border border-border/60 hover:bg-chrome"
            )}
          >
            할 일
          </button>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-5 pb-36 pt-4">
          {currentTab === "grocery" ? (
            activeItems.filter(i => i.category === "grocery" || i.category === "inbox").length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* Dominant summary */}
                <section aria-label="오늘의 상태" className="mb-6 rounded-2xl bg-primary/5 p-5 border border-primary/10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold leading-none tracking-tight text-foreground">
                      {remaining}
                    </span>
                    <span className="text-base font-medium text-muted-foreground">개 남았어요</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{summaryLine}</span>
                    {doneToday > 0 && (
                      <span className="flex items-center gap-1 font-medium text-success">
                        <span className="text-border">·</span>
                        <IconCheck size={14} stroke={3} />
                        오늘 {doneToday}개 완료
                      </span>
                    )}
                  </div>
                </section>

                {/* Inbox: just captured, not sorted yet */}
                {inbox.length > 0 && (
                  <section className="mb-6 rounded-2xl bg-surface px-4 py-3 shadow-sm border border-border/40">
                    <h3 className="mb-3 text-base font-extrabold flex items-center gap-2 text-foreground">새로 담은 것 <span className="text-muted-foreground font-normal text-sm">({inbox.length})</span></h3>
                    <ul className="divide-y divide-border/60">
                      {inbox.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 py-3">
                          <span className="min-w-0 flex-1 truncate text-base text-foreground">{item.title}</span>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => onAssignCategory(item.id, "grocery")}
                              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border/80 px-4 text-xs font-bold text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95"
                            >
                              <IconShoppingCart size={14} stroke={2.5} />
                              장보기
                            </button>
                            <button
                              type="button"
                              onClick={() => onAssignCategory(item.id, "todo")}
                              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border/80 px-4 text-xs font-bold text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95"
                            >
                              <IconChecklist size={14} stroke={2.5} />
                              할 일
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Lists */}
                <GroceryFolders
                  items={items}
                  members={members}
                  onToggleDone={onToggleDone}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onSelect={setSelectedItem}
                  addItem={props.addItem}
                  editItem={editItem}
                />
              </>
            )
          ) : (
            <CalendarView 
              items={items} 
              members={members} 
              onToggleDone={onToggleDone} 
              onDelete={handleDelete}
              onEdit={handleEditTodo}
              onAddTodo={(title, dateStr) => props.addItem({ title, category: "todo", meta: dateStr })} 
            />
          )}
        </main>

        <ActivitySheet
          open={activityOpen}
          items={items}
          members={members}
          onClose={() => setActivityOpen(false)}
        />

        {userId && familyId && (
          <ItemDetailSheet
            open={!!selectedItem}
            item={selectedItem}
            members={members}
            userId={userId}
            familyId={familyId}
            onClose={() => setSelectedItem(null)}
          />
        )}

        {/* Bottom bar */}
        {currentTab === "grocery" && (
          <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl z-10">
            <div className="bg-surface/80 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 backdrop-blur-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) {
                    props.addItem({ title: draft.trim(), category: "grocery" });
                    setDraft("");
                  }
                }}
                className="flex items-center gap-3 rounded-full border border-border/50 bg-background p-1.5 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  type="text"
                  placeholder="장보기 항목을 추가하세요..."
                  className="h-11 min-w-0 flex-1 bg-transparent px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  <IconPlus size={22} stroke={2.5} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 px-2">
        <h2 className="text-sm font-bold text-muted-foreground">{label} <span className="font-normal">({count})</span></h2>
      </div>
      <div className="rounded-2xl bg-surface px-4 py-2">{children}</div>
    </section>
  );
}

function SwipeableItem({
  item,
  members,
  onToggle,
  onDelete,
  onEdit,
  onMove,
  onSelect,
}: {
  item: Item;
  members: Member[];
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: Item) => void;
  onMove?: (item: Item) => void;
  onSelect?: (item: Item) => void;
}) {
  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (diff > 40) { // Swiped left
      setSwiped(true);
    } else if (diff < -40) { // Swiped right
      setSwiped(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (swiped) {
      setSwiped(false);
      e.stopPropagation();
      return;
    }
    onSelect?.(item);
  };

  return (
    <li className="group relative flex overflow-hidden border-b border-border/40 last:border-0 bg-surface">
      {/* Foreground Main Content */}
      <div 
        className={clsx(
          "relative z-10 flex-1 min-w-0 flex items-center py-3 bg-surface transition-transform duration-300 ease-out cursor-pointer active:bg-chrome/40 sm:active:bg-surface",
          swiped ? "-translate-x-[132px] sm:translate-x-0" : "translate-x-0"
        )}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
          className={clsx(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors mr-3",
            item.done ? "border-2 border-primary bg-primary text-primary-foreground" : "border-2 border-border text-transparent"
          )}
        >
          {item.done && <IconCheck size={13} stroke={3} />}
        </button>
        <span className="min-w-0 flex-1 pr-4">
          <span className={clsx("block truncate text-base", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
            {item.title}
          </span>
          <span className="block text-xs text-muted-foreground">
            {memberName(members, item.addedBy)}{item.meta ? ` · ${item.meta}` : ""}
          </span>
        </span>
      </div>

      {/* Swipe Actions (Mobile Underneath, PC Right Side) */}
      {(onEdit || onDelete || onMove) && (
        <div className={clsx(
          "absolute inset-y-0 right-0 z-0 flex items-center bg-surface gap-1 pr-2 pl-2 transition-opacity",
          "sm:relative sm:flex sm:shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:pr-0 sm:z-auto"
        )}>
          {onMove && (
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
              onClick={() => { setSwiped(false); onMove(item); }}
              title="폴더 이동"
            >
              <IconFolder size={20} stroke={2} />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-primary active:scale-90 transition-all"
              onClick={() => { setSwiped(false); onEdit(item); }}
              title="수정"
            >
              <IconEdit size={20} stroke={2} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-danger active:scale-90 transition-all"
              onClick={() => { setSwiped(false); onDelete(item.id); }}
              title="삭제"
            >
              <IconTrash size={20} stroke={2} />
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export function ItemRows({
  items,
  members,
  onToggle,
  onDelete,
  onEdit,
  onMove,
  onSelect,
}: {
  items: Item[];
  members: Member[];
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: Item) => void;
  onMove?: (item: Item) => void;
  onSelect?: (item: Item) => void;
}) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">모두 담아뒀어요</p>;
  }
  return (
    <ul className="divide-y divide-border/60">
      {items.map((item) => (
        <SwipeableItem 
          key={item.id} 
          item={item} 
          members={members} 
          onToggle={onToggle} 
          onDelete={onDelete} 
          onEdit={onEdit} 
          onMove={onMove}
          onSelect={onSelect}
        />
      ))}
    </ul>
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

function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chrome/60 text-muted-foreground">
        <IconPackage size={26} stroke={1.5} />
      </div>
      <p className="mt-4 text-base font-bold text-foreground">아직 담긴 게 없어요</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        다 떨어진 것이나 할 일이 떠오르면
        <br />
        아래 입력창에 바로 담아보세요
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span className="text-base font-bold text-primary">담아락</span>
          <div className="h-9 w-9 animate-pulse rounded-full bg-chrome" />
        </div>
        <div className="px-4 pt-4">
          <div className="h-4 w-32 animate-pulse rounded bg-chrome" />
          <div className="mt-3 h-24 animate-pulse rounded-lg bg-chrome/70" />
          <div className="mt-6 h-4 w-20 animate-pulse rounded bg-chrome" />
          <div className="mt-2 h-40 animate-pulse rounded-lg bg-chrome/50" />
          <div className="mt-6 h-4 w-16 animate-pulse rounded bg-chrome" />
          <div className="mt-2 h-32 animate-pulse rounded-lg bg-chrome/50" />
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <header className="border-b border-border/60 px-4 py-3">
        <span className="text-base font-bold tracking-tight text-primary">담아락</span>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chrome/60 text-danger">
          <IconWifiOff size={24} stroke={1.5} />
        </div>
        <p className="mt-4 text-base font-bold text-foreground">목록을 불러오지 못했어요</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          인터넷 연결을 확인하고
          <br />
          다시 시도해주세요
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = window.location.pathname;
          }}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded bg-primary px-5 text-sm font-bold text-primary-foreground active:scale-95"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
