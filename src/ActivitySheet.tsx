import { useEffect } from "react";
import { IconX, IconCheck, IconPlus } from "@tabler/icons-react";
import { memberName, type Item, type Member } from "./data";
import { useI18n } from "./lib/i18n";
import clsx from "clsx";

export default function ActivitySheet({
  open,
  items,
  members,
  onClose,
}: {
  open: boolean;
  items: Item[];
  members: Member[];
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Recent 30 items
  const recentItems = [...items]
    .filter(i => i.title !== "__SYSTEM_FOLDERS__" && i.category !== "system")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative flex h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-border bg-surface shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        {/* Handle */}
        <div className="flex w-full items-center justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-border" />
        </div>

        <header className="flex items-center justify-between px-6 pb-2">
          <h2 className="text-xl font-extrabold text-foreground">{t("activity.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
          >
            <IconX size={20} stroke={2} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-6 pb-12 pt-2">


          <h3 className="text-sm font-bold text-muted-foreground mb-4">{t("activity.recent")}</h3>
          <ul className="flex flex-col gap-5">
            {recentItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{t("activity.empty")}</p>
            ) : (
              recentItems.map((item) => {
                const member = members.find((m) => m.id === item.addedBy);
                const timeAgo = getTimeAgo(item.created_at, t);
                const name = memberName(members, item.addedBy);

                return (
                  <li key={item.id} className="flex gap-4">
                    <span className="relative mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chrome text-base font-bold text-chrome-foreground shadow-sm overflow-hidden">
                      {member?.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        member?.initial ?? "?"
                      )}
                      <span className={clsx(
                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-surface flex items-center justify-center",
                        item.done ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                      )}>
                        {item.done ? <IconCheck size={10} stroke={3} /> : <IconPlus size={10} stroke={3} />}
                      </span>
                    </span>
                    <div className="flex flex-col pt-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.done
                          ? t("activity.completed", { name, title: item.title })
                          : t("activity.added", { name, title: item.title })}
                      </p>
                      <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                        {timeAgo} · {item.category === 'grocery' ? t("common.grocery") : item.category === 'todo' ? t("common.todo") : t("common.memo")}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </main>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string, t: (key: string, vars?: Record<string, string | number>) => string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("time.justNow");
  if (minutes < 60) return t("time.minutesAgo", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("time.hoursAgo", { n: hours });
  const days = Math.floor(hours / 24);
  return t("time.daysAgo", { n: days });
}
