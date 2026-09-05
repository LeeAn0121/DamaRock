import { useMemo, useState, useEffect } from "react";
import clsx from "clsx";
import { IconCalendar, IconList, IconCheck, IconChecklist, IconPackage, IconPlus, IconSettings, IconShoppingCart, IconWifiOff } from "@tabler/icons-react";
import type { Category, Item, Member } from "./data";
import ActivitySheet from "./ActivitySheet";
import CalendarView from "./CalendarView";
import AddGrocerySheet from "./AddGrocerySheet";
import ItemDetailSheet from "./ItemDetailSheet";
import GroceryFolders from "./GroceryFolders";
import { ItemRows } from "./ItemRows";
import { useI18n } from "./lib/i18n";

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
  comments?: import("./data").Comment[];
  familyId: string | null;
  onToggleDone: (id: string) => void;
  onAssignCategory: (id: string, category: Category) => void;
  onQuickAdd: (title: string) => void;
  addItem: (item: Pick<Item, "title" | "category" | "meta">) => void;
  editItem: (id: string, title: string, meta?: string | null) => void;
  moveItems: (ids: string[], target: Category) => void;
  onOpenAddSheet: () => void;
  onOpenSettings: () => void;
  onOpenInvite: () => void;
  deleteItem: (id: string) => void;
  restoreItem: (id: string) => void;
  hardDeleteItem: (id: string) => void;
  refreshData?: () => void;
  hasUnreadActivity?: boolean;
  clearUnreadActivity?: () => void;
}) {
  const { t } = useI18n();
  const {
    items,
    members,
    userId,
    familyId,
    onToggleDone,
    onAssignCategory,
    editItem,
    onOpenSettings,
    onOpenInvite,
    deleteItem,
    refreshData,
    hasUnreadActivity,
    clearUnreadActivity,
  } = props;
  const viewState = useUrlState();
  const [currentTab, setCurrentTab] = useState<"grocery" | "todo">("grocery");

  // Refresh data whenever the tab changes to ensure fresh state
  useEffect(() => {
    refreshData?.();
  }, [currentTab, refreshData]);

  const [activityOpen, setActivityOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [todoView, setTodoView] = useState<"list" | "calendar">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [addGroceryOpen, setAddGroceryOpen] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY});
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchEndX - touchStart.x;

    // Only switch tabs if the swipe is significant and horizontal
    if (Math.abs(distance) > 80) {
      if (distance > 0) {
        // Swiped right -> go to grocery (if on todo)
        setCurrentTab("grocery");
      } else {
        // Swiped left -> go to todo (if on grocery)
        setCurrentTab("todo");
      }
    }
    setTouchStart(null);
  };

  const handleEdit = (item: Item) => {
    const newTitle = window.prompt(t("home.promptEditItem"), item.title);
    if (newTitle && newTitle.trim() !== item.title) {
      editItem(item.id, newTitle.trim());
    }
  };

  const handleEditTodo = (item: Item) => {
    const newTitle = window.prompt(t("home.promptEditTodo"), item.title);
    if (newTitle === null) return;
    const newDate = window.prompt(t("home.promptEditDate"), item.meta || "");
    if (newDate === null) return;

    if (newTitle.trim() !== item.title || newDate.trim() !== item.meta) {
      editItem(item.id, newTitle.trim(), newDate.trim());
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t("home.confirmDelete"))) {
      deleteItem(id);
    }
  };

  const activeItems = viewState === "empty" ? [] : items.filter(i => i.title !== "__SYSTEM_FOLDERS__" && !i.deleted_at);
  const inbox = activeItems.filter((i) => i.category === "inbox");
  const grocery = activeItems.filter((i) => i.category === "grocery");
  const todo = activeItems.filter((i) => i.category === "todo");

  const remaining = activeItems.filter((i) => !i.done).length;
  const doneToday = activeItems.filter((i) => i.done).length;

  const summaryLine = useMemo(() => {
    const groceryLeft = grocery.filter((i) => !i.done).length;
    const todoLeft = todo.filter((i) => !i.done).length;
    return t("home.summaryLine", { grocery: groceryLeft, todo: todoLeft });
  }, [grocery, todo, t]);

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
            <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt={t("appName")} className="h-6 w-6 rounded-md shadow-sm" />
            <span className="text-xl font-extrabold tracking-tight text-primary">{t("appName")}</span>
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

                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label={t("home.activity")}
              onClick={() => { setActivityOpen(true); clearUnreadActivity?.(); }}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {hasUnreadActivity && (
                <span className="absolute top-2 right-2.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white shadow-sm ring-2 ring-background">
                  1
                </span>
              )}
            </button>
<button
              type="button"
              aria-label={t("home.search")}
              onClick={() => setSearchOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
            <button
              type="button"
              aria-label={t("home.settings")}
              onClick={onOpenSettings}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
            >
              <IconSettings size={22} stroke={2} />
            </button>
          </div>
</header>

        {/* Search Bar Overlay */}
        {searchOpen && (
          <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-md px-5 py-4 flex flex-col animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 flex items-center bg-chrome px-4 py-2.5 rounded-2xl border border-border/50">
                <svg className="text-muted-foreground mr-2 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  autoFocus
                  placeholder={t("home.searchPlaceholder")}
                  className="bg-transparent flex-1 outline-none text-foreground font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-muted-foreground p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                )}
              </div>
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-sm font-bold text-foreground py-2 px-1">{t("common.cancel")}</button>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 pb-10">
              {searchQuery.trim().length > 0 ? (
                <div className="bg-surface rounded-2xl shadow-sm border border-border/40 p-2">
                  <ItemRows
                    items={activeItems.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))}
                    onToggle={onToggleDone}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onSelect={setSelectedItem}
                    members={members}
                    comments={props.comments}
                    userId={userId}
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm mt-10">{t("home.searchEmpty")}</p>
              )}
            </div>
          </div>
        )}


        {/* Tabs - Fixed below header. Tapping 할 일 while already on it
            cycles list <-> calendar, so there's one button, not two. */}
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
            {t("common.grocery")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentTab === "todo") {
                setTodoView(v => v === "list" ? "calendar" : "list");
              } else {
                setCurrentTab("todo");
              }
            }}
            className={clsx(
              "flex-1 whitespace-nowrap rounded-xl py-2.5 text-[15px] font-bold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5",
              currentTab === "todo"
                ? "bg-foreground text-background"
                : "bg-surface text-muted-foreground border border-border/60 hover:bg-chrome"
            )}
          >
            {t("common.todo")}
            {currentTab === "todo" && (
              todoView === "list" ? <IconList size={15} stroke={2.5} /> : <IconCalendar size={15} stroke={2.5} />
            )}
          </button>
        </div>

        {/* Content */}
        <main
          className="flex-1 overflow-y-auto px-5 pb-36 pt-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div key={currentTab} className="animate-in fade-in duration-200">
          {currentTab === "grocery" ? (
            activeItems.filter(i => i.category === "grocery" || i.category === "inbox").length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* Dominant summary */}
                <section aria-label={t("home.remaining", { n: remaining })} className="mb-6 rounded-2xl bg-primary/5 p-5 border border-primary/10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold leading-none tracking-tight text-foreground">
                      {remaining}
                    </span>
                    <span className="text-base font-medium text-muted-foreground">{t("home.remainingSuffix")}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{summaryLine}</span>
                    {doneToday > 0 && (
                      <span className="flex items-center gap-1 font-medium text-success">
                        <span className="text-border">·</span>
                        <IconCheck size={14} stroke={3} />
                        {t("home.doneToday", { n: doneToday })}
                      </span>
                    )}
                  </div>
                </section>

                {/* Invite nudge: only useful while there's no one else to share with yet */}
                {members.length <= 1 && (
                  <div
                    onClick={onOpenInvite}
                    className="mb-6 flex cursor-pointer items-center justify-between rounded-xl bg-primary/10 px-4 py-3 transition-transform active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{t("home.inviteBannerTitle")}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{t("home.inviteBannerDesc")}</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full" onClick={(e) => { e.stopPropagation(); onOpenInvite(); }}>{t("home.inviteCta")}</button>
                  </div>
                )}

                {/* Inbox: just captured, not sorted yet */}
                {inbox.length > 0 && (
                  <section className="mb-6 rounded-2xl bg-surface px-4 py-3 shadow-sm border border-border/40">
                    <h3 className="mb-3 text-base font-extrabold flex items-center gap-2 text-foreground">{t("home.newlyAdded")} <span className="text-muted-foreground font-normal text-sm">({inbox.length})</span></h3>
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
                              {t("common.grocery")}
                            </button>
                            <button
                              type="button"
                              onClick={() => onAssignCategory(item.id, "todo")}
                              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border/80 px-4 text-xs font-bold text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95"
                            >
                              <IconChecklist size={14} stroke={2.5} />
                              {t("common.todo")}
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
                  onRestore={props.restoreItem}
                  onHardDelete={props.hardDeleteItem}
                />
              </>
            )
          ) : (
            <>


              {todoView === "calendar" ? (
                <CalendarView
                  items={todo}
                  members={members}
                  comments={props.comments}
                  userId={userId}
                  onToggleDone={onToggleDone}
                  onAddTodo={(title, dateStr) => props.addItem({ title, category: "todo", meta: dateStr })}
                  onDelete={handleDelete}
                  onEdit={handleEditTodo}
                />
              ) : (
                <div className="bg-surface rounded-2xl shadow-sm border border-border/40 p-3">
                  <h3 className="text-sm font-bold text-muted-foreground ml-2 mb-3 mt-1">{t("home.todoListTitle")}</h3>
                  <ItemRows
                    items={todo}
                    onToggle={onToggleDone}
                    onDelete={handleDelete}
                    onEdit={handleEditTodo}
                    onSelect={setSelectedItem}
                    members={members}
                    comments={props.comments}
                    userId={userId}
                  />
                </div>
              )}
            </>
          )}
          </div>
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
              <button
                onClick={() => setAddGroceryOpen(true)}
                className="w-full flex items-center justify-between gap-3 rounded-full border border-border/50 bg-background p-3 shadow-sm hover:border-primary/50 transition-colors text-left"
              >
                <span className="text-muted-foreground text-sm font-medium pl-2">{t("home.addGroceryPlaceholder")}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <IconPlus size={18} stroke={2.5} />
                </span>
              </button>
            </div>
          </div>
        )}

        <AddGrocerySheet
          open={addGroceryOpen}
          items={items}
          onClose={() => setAddGroceryOpen(false)}
          onAdd={(folderId, title, memo) => {
            const meta = memo ? folderId + "::MEMO::" + memo : folderId;
            props.addItem({ title, category: "grocery", meta });
          }}
        />
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="mt-16 flex flex-col items-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chrome/60 text-muted-foreground">
        <IconPackage size={26} stroke={1.5} />
      </div>
      <p className="mt-4 text-base font-bold text-foreground">{t("home.emptyTitle")}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {t("home.emptyDesc")}
      </p>
    </div>
  );
}

function SkeletonBlock({ className, delay }: { className: string; delay: number }) {
  return (
    <div
      className={clsx("animate-in fade-in slide-in-from-bottom-1 fill-mode-both", className)}
      style={{ animationDelay: `${delay}ms`, animationDuration: "500ms" }}
    >
      <div className="h-full w-full animate-pulse rounded-[inherit] bg-chrome" />
    </div>
  );
}

export function LoadingState() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col items-center bg-background font-sans">
      <div className="flex min-h-dvh w-full max-w-md flex-col">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span className="flex animate-in fade-in items-center gap-2 text-base font-bold text-primary">
            <img
              src={`${import.meta.env.BASE_URL}icon-192.png`}
              alt=""
              className="h-6 w-6 animate-pulse rounded-md"
              style={{ animationDuration: "1.6s" }}
            />
            {t("appName")}
          </span>
          <SkeletonBlock className="h-9 w-9 rounded-full" delay={0} />
        </div>
        <div className="px-4 pt-4">
          <SkeletonBlock className="h-4 w-32 rounded" delay={60} />
          <div className="mt-3">
            <SkeletonBlock className="h-24 rounded-lg" delay={120} />
          </div>
          <div className="mt-6">
            <SkeletonBlock className="h-4 w-20 rounded" delay={180} />
          </div>
          <div className="mt-2">
            <SkeletonBlock className="h-40 rounded-lg" delay={240} />
          </div>
          <div className="mt-6">
            <SkeletonBlock className="h-4 w-16 rounded" delay={300} />
          </div>
          <div className="mt-2">
            <SkeletonBlock className="h-32 rounded-lg" delay={360} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <header className="border-b border-border/60 px-4 py-3">
        <span className="text-base font-bold tracking-tight text-primary">{t("appName")}</span>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chrome/60 text-danger">
          <IconWifiOff size={24} stroke={1.5} />
        </div>
        <p className="mt-4 text-base font-bold text-foreground">{t("home.errorTitle")}</p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {t("home.errorDesc")}
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = window.location.pathname;
          }}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded bg-primary px-5 text-sm font-bold text-primary-foreground active:scale-95"
        >
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}
