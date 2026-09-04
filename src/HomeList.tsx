import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Inbox,
  ListChecks,
  ListPlus,
  PackageOpen,
  Plus,
  Settings2,
  ShoppingCart,
  WifiOff,
} from "lucide-react";
import { memberName, type Category, type Item, type Member } from "./data";

type ViewState = "normal" | "empty" | "loading" | "error";

function useUrlState(): ViewState {
  if (typeof window === "undefined") return "normal";
  const v = new URLSearchParams(window.location.search).get("state");
  if (v === "empty" || v === "loading" || v === "error") return v;
  return "normal";
}

export default function HomeList({
  items,
  members,
  onToggleDone,
  onAssignCategory,
  onQuickAdd,
  onOpenAddSheet,
  onOpenSettings,
}: {
  items: Item[];
  members: Member[];
  onToggleDone: (id: string) => void;
  onAssignCategory: (id: string, category: Category) => void;
  onQuickAdd: (title: string) => void;
  onOpenAddSheet: () => void;
  onOpenSettings: () => void;
}) {
  const viewState = useUrlState();
  const [showDoneGrocery, setShowDoneGrocery] = useState(false);
  const [showDoneTodo, setShowDoneTodo] = useState(false);
  const [draft, setDraft] = useState("");

  const activeItems = viewState === "empty" ? [] : items;
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

  const submitDraft = () => {
    const text = draft.trim();
    if (!text) return;
    onQuickAdd(text);
    setDraft("");
  };

  if (viewState === "loading") {
    return <LoadingState />;
  }

  if (viewState === "error") {
    return <ErrorState />;
  }

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 pt-6">
          <span className="text-base font-bold tracking-tight text-primary">담아락</span>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {members.map((m, idx) => (
                <div
                  key={m.id}
                  className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-chrome text-xs font-semibold text-chrome-foreground"
                  style={{ zIndex: members.length - idx }}
                >
                  {m.initial}
                  {m.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background bg-success" />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="설정"
              onClick={onOpenSettings}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
            >
              <Settings2 size={19} strokeWidth={1.75} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 pb-36 pt-5">
          <h1 className="text-sm font-medium text-muted-foreground">우리집 공유 리스트</h1>

          {activeItems.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Dominant summary */}
              <section
                aria-label="오늘의 상태"
                className="mt-3 rounded-2xl bg-surface p-5 shadow-[0_1px_2px_rgba(20,20,10,0.04),0_10px_28px_-14px_rgba(20,20,10,0.18)]"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold leading-none tracking-tight text-foreground">
                    {remaining}
                  </span>
                  <span className="text-base font-medium text-muted-foreground">개 남았어요</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{summaryLine}</span>
                  {doneToday > 0 && (
                    <span className="flex items-center gap-1 text-success">
                      <span className="text-border">·</span>
                      <Check size={13} strokeWidth={2.5} />
                      오늘 {doneToday}개 완료
                    </span>
                  )}
                </div>
              </section>

              {/* Inbox: just captured, not sorted yet */}
              {inbox.length > 0 && (
                <SectionGroup icon={<Inbox size={16} strokeWidth={1.75} />} label="새로 담은 것" count={inbox.length}>
                  <ul className="divide-y divide-border/60">
                    {inbox.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 py-3">
                        <span className="min-w-0 flex-1 truncate text-base text-foreground">{item.title}</span>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => onAssignCategory(item.id, "grocery")}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary active:bg-chrome"
                          >
                            장보기
                          </button>
                          <button
                            type="button"
                            onClick={() => onAssignCategory(item.id, "todo")}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary active:bg-chrome"
                          >
                            할 일
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </SectionGroup>
              )}

              {/* Grocery */}
              <SectionGroup icon={<ShoppingCart size={16} strokeWidth={1.75} />} label="장보기" count={grocery.filter((i) => !i.done).length}>
                <ItemRows items={grocery.filter((i) => !i.done)} onToggle={onToggleDone} members={members} />
                {grocery.some((i) => i.done) && (
                  <DoneDisclosure
                    open={showDoneGrocery}
                    onToggle={() => setShowDoneGrocery((v) => !v)}
                    count={grocery.filter((i) => i.done).length}
                  >
                    <ItemRows items={grocery.filter((i) => i.done)} onToggle={onToggleDone} members={members} />
                  </DoneDisclosure>
                )}
              </SectionGroup>

              {/* Todo */}
              <SectionGroup icon={<ListChecks size={16} strokeWidth={1.75} />} label="할 일" count={todo.filter((i) => !i.done).length}>
                <ItemRows items={todo.filter((i) => !i.done)} onToggle={onToggleDone} members={members} />
                {todo.some((i) => i.done) && (
                  <DoneDisclosure
                    open={showDoneTodo}
                    onToggle={() => setShowDoneTodo((v) => !v)}
                    count={todo.filter((i) => i.done).length}
                  >
                    <ItemRows items={todo.filter((i) => i.done)} onToggle={onToggleDone} members={members} />
                  </DoneDisclosure>
                )}
              </SectionGroup>
            </>
          )}
        </main>

        {/* Quick capture — always reachable at the thumb */}
        <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md">
          <div className="border-t border-border/70 bg-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitDraft();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                aria-label="자세히 담기"
                onClick={onOpenAddSheet}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary active:bg-chrome"
              >
                <ListPlus size={20} strokeWidth={1.75} />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                type="text"
                placeholder="다 떨어진 것이나 할 일을 적어보세요"
                aria-label="새 항목 담기"
                className="h-12 min-w-0 flex-1 rounded-full border border-border bg-chrome/40 px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus/40"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="담기"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform disabled:bg-chrome disabled:text-muted-foreground active:scale-95"
              >
                <Plus size={22} strokeWidth={2} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionGroup({
  icon,
  label,
  count,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-2 px-1 text-muted-foreground">
        {icon}
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="text-sm text-border">·</span>
        <span className="text-sm">{count}</span>
      </div>
      <div className="rounded-2xl bg-chrome/40 px-3 py-1">{children}</div>
    </section>
  );
}

function ItemRows({
  items,
  members,
  onToggle,
}: {
  items: Item[];
  members: Member[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">모두 담아뒀어요</p>;
  }
  return (
    <ul className="divide-y divide-border/60">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onToggle(item.id)}
            className="flex min-h-11 w-full items-center gap-3 py-3 text-left"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                item.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-transparent"
              }`}
            >
              <Check size={14} strokeWidth={2.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-base ${
                  item.done ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.title}
              </span>
              <span className="block text-xs text-muted-foreground">
                {memberName(members, item.addedBy)} 추가{item.meta ? ` · ${item.meta}` : ""}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function DoneDisclosure({
  open,
  onToggle,
  count,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-11 w-full items-center gap-1 py-3 text-xs font-medium text-muted-foreground"
      >
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
        완료 {count}개 {open ? "숨기기" : "보기"}
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chrome/60 text-muted-foreground">
        <PackageOpen size={26} strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-base font-medium text-foreground">아직 담긴 게 없어요</p>
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
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-primary">담아락</span>
          <div className="h-9 w-9 animate-pulse rounded-full bg-chrome" />
        </div>
        <div className="mt-5 h-4 w-32 animate-pulse rounded-full bg-chrome" />
        <div className="mt-3 h-28 animate-pulse rounded-2xl bg-chrome/70" />
        <div className="mt-6 h-4 w-20 animate-pulse rounded-full bg-chrome" />
        <div className="mt-2 h-40 animate-pulse rounded-2xl bg-chrome/50" />
        <div className="mt-6 h-4 w-16 animate-pulse rounded-full bg-chrome" />
        <div className="mt-2 h-32 animate-pulse rounded-2xl bg-chrome/50" />
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <header className="px-4 pt-6">
        <span className="text-base font-bold tracking-tight text-primary">담아락</span>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chrome/60 text-danger">
          <WifiOff size={24} strokeWidth={1.5} />
        </div>
        <p className="mt-4 text-base font-medium text-foreground">목록을 불러오지 못했어요</p>
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
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground active:scale-95"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
