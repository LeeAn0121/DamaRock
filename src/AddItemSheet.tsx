import { useEffect, useState } from "react";
import clsx from "clsx";
import { IconX } from "@tabler/icons-react";
import type { Category, Item, Member } from "./data";

type Draft = {
  title: string;
  category: Category;
  note: string;
  assignee?: string;
  due?: string;
};

const DUE_CHIPS = ["오늘", "이번 주말", "다음 주"];

export default function AddItemSheet({
  open,
  members,
  onClose,
  onSubmit,
}: {
  open: boolean;
  members: Member[];
  onClose: () => void;
  onSubmit: (item: Omit<Item, "id" | "done">) => void;
}) {
  const [draft, setDraft] = useState<Draft>({ title: "", category: "grocery", note: "" });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = draft.title.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const meta = draft.category === "todo" ? draft.due : draft.note || undefined;
    onSubmit({
      title: draft.title.trim(),
      category: draft.category,
      addedBy: "me",
      assignee: draft.assignee,
      meta,
    });
    setDraft({ title: "", category: "grocery", note: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-sheet-title"
        className="relative w-full max-w-md rounded-t-2xl bg-surface pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-8px_30px_-12px_rgba(20,20,10,0.25)]"
      >
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" />

        <div className="flex items-center justify-between px-5 pt-3">
          <h2 id="add-sheet-title" className="text-base font-bold text-foreground">
            새 항목 담기
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-chrome/60 active:bg-chrome"
          >
            <IconX size={18} stroke={1.75} />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-5 px-5">
          {/* Category segmented control */}
          <div className="flex rounded-full bg-chrome/50 p-1">
            {(["grocery", "todo"] as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, category: c }))}
                aria-pressed={draft.category === c}
                className={clsx(
                  "min-h-11 flex-1 rounded-full text-sm font-bold transition-colors",
                  draft.category === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {c === "grocery" ? "장보기" : "할 일"}
              </button>
            ))}
          </div>

          {/* Title */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-foreground">
              무엇을 담을까요<span className="text-danger"> *</span>
            </span>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder={draft.category === "grocery" ? "예: 우유" : "예: 지우 학원비 입금"}
              className="h-12 rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus/40"
            />
          </label>

          {draft.category === "grocery" ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-foreground">
                수량이나 메모<span className="text-muted-foreground"> (선택)</span>
              </span>
              <input
                value={draft.note}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                placeholder="예: 2개"
                className="h-12 rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus/40"
              />
            </label>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-foreground">
                언제까지<span className="text-muted-foreground"> (선택)</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {DUE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, due: d.due === chip ? undefined : chip }))
                    }
                    aria-pressed={draft.due === chip}
                    className={clsx(
                      "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm transition-colors",
                      draft.due === chip
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assignee */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-foreground">
              담당자<span className="text-muted-foreground"> (선택)</span>
            </span>
            <div className="flex gap-3">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, assignee: d.assignee === m.id ? undefined : m.id }))
                  }
                  aria-pressed={draft.assignee === m.id}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={clsx(
                      "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-colors",
                      draft.assignee === m.id
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-surface"
                        : "bg-chrome text-chrome-foreground"
                    )}
                  >
                    {m.initial}
                  </span>
                  <span className="text-xs text-muted-foreground">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 px-5">
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground transition-transform disabled:bg-chrome disabled:text-muted-foreground active:scale-[0.98]"
          >
            담기
          </button>
        </div>
      </div>
    </div>
  );
}
