import { useState } from "react";
import { IconChevronLeft, IconCheck, IconUsers, IconUserPlus } from "@tabler/icons-react";
import type { Family } from "./hooks/useAppData";
import { useI18n } from "./lib/i18n";
import Spinner from "./components/Spinner";

export default function GroupSwitcher({
  families,
  activeFamilyId,
  onSwitch,
  onCreate,
  onJoin,
  onBack,
  error,
}: {
  families: Family[];
  activeFamilyId: string | null;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
  onJoin: (code: string) => Promise<void>;
  onBack: () => void;
  error?: string | null;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"list" | "create" | "join">("list");
  const [name, setName] = useState(t("onboarding.defaultFamilyName"));
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeFamily = families.find((f) => f.id === activeFamilyId);
  const otherFamilies = families.filter((f) => f.id !== activeFamilyId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate(name.trim() || t("onboarding.defaultFamilyName"));
      setMode("list");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      await onJoin(code.trim());
      setMode("list");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md md:max-w-2xl lg:max-w-4xl flex-col">
        <header className="flex items-center gap-1 border-b border-border/60 px-2 py-3">
          <button
            type="button"
            aria-label={t("common.back")}
            onClick={() => (mode === "list" ? onBack() : setMode("list"))}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-chrome/60 active:bg-chrome"
          >
            <IconChevronLeft size={20} stroke={1.75} />
          </button>
          <h1 className="text-base font-bold text-foreground">{t("groups.title")}</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-10 pt-4">
          {mode === "list" && (
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
              {error && (
                <p className="mb-4 rounded-lg bg-danger/10 px-4 py-2 text-center text-[13px] font-bold text-danger">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-2">
                {activeFamily && (
                  <div className="flex items-center gap-3 rounded-2xl border border-primary bg-primary/5 px-4 py-3.5 shadow-sm">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <IconUsers size={20} stroke={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold text-foreground">{activeFamily.name}</span>
                      <span className="block text-xs font-bold text-primary">{t("groups.current")}</span>
                    </span>
                    <IconCheck size={18} stroke={3} className="shrink-0 text-primary" />
                  </div>
                )}
                {otherFamilies.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onSwitch(f.id)}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-chrome/40 active:scale-[0.99]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-chrome text-chrome-foreground shadow-sm">
                      <IconUsers size={20} stroke={2} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-base font-medium text-foreground">{f.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => { setName(t("onboarding.defaultFamilyName")); setMode("create"); }}
                  className="group flex items-center gap-4 rounded-2xl bg-surface p-5 border border-border/40 shadow-sm transition-all hover:border-primary/40 active:scale-[0.98]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <IconUsers size={22} stroke={2} />
                  </span>
                  <span className="flex flex-col text-left">
                    <span className="text-base font-bold text-foreground">{t("groups.createNew")}</span>
                    <span className="mt-0.5 text-[13px] font-medium text-muted-foreground group-hover:text-foreground/80">{t("onboarding.createDesc")}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => { setCode(""); setMode("join"); }}
                  className="group flex items-center gap-4 rounded-2xl bg-surface p-5 border border-border/40 shadow-sm transition-all hover:border-foreground/20 active:scale-[0.98]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-chrome text-foreground shadow-sm">
                    <IconUserPlus size={22} stroke={2} />
                  </span>
                  <span className="flex flex-col text-left">
                    <span className="text-base font-bold text-foreground">{t("groups.joinExisting")}</span>
                    <span className="mt-0.5 text-[13px] font-medium text-muted-foreground group-hover:text-foreground/80">{t("onboarding.joinDesc")}</span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {mode === "create" && (
            <form
              onSubmit={handleCreate}
              className="flex w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-2 flex-col gap-6 pt-4 duration-300"
            >
              <div className="text-center mb-4">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{t("onboarding.createTitle")}</h1>
                <p className="mt-2 text-[14px] text-muted-foreground">{t("onboarding.createHeading")}</p>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-bold text-foreground/80 ml-1">{t("onboarding.familyNameLabel")}</span>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("onboarding.familyNamePlaceholder")}
                  className="h-14 rounded-xl border border-border/60 bg-surface px-5 text-[15px] font-medium text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </label>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  disabled={submitting}
                  className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-surface border border-border/60 text-[15px] font-bold text-foreground shadow-sm hover:bg-chrome transition-colors disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-14 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-sm transition-transform active:scale-[0.98] disabled:opacity-70"
                >
                  {submitting && <Spinner size={18} />}
                  {t("onboarding.createSubmit")}
                </button>
              </div>
            </form>
          )}

          {mode === "join" && (
            <form
              onSubmit={handleJoin}
              className="flex w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-2 flex-col gap-6 pt-4 duration-300"
            >
              <div className="text-center mb-4">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{t("onboarding.joinTitle")}</h1>
                <p className="mt-2 text-[14px] text-muted-foreground">{t("onboarding.joinHeading")}</p>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-bold text-foreground/80 ml-1">{t("onboarding.codeLabel")}</span>
                <input
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("onboarding.codePlaceholder")}
                  className="h-14 rounded-xl border border-border/60 bg-surface px-5 text-center text-xl font-bold tracking-widest text-foreground placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-medium shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                />
              </label>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  disabled={submitting}
                  className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-surface border border-border/60 text-[15px] font-bold text-foreground shadow-sm hover:bg-chrome transition-colors disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!code.trim() || submitting}
                  className="flex min-h-14 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-sm transition-transform disabled:bg-chrome disabled:text-muted-foreground disabled:shadow-none active:scale-[0.98]"
                >
                  {submitting && <Spinner size={18} />}
                  {t("onboarding.joinSubmit")}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
