import { useState } from "react";
import { IconLogout, IconUserPlus, IconUsers } from "@tabler/icons-react";
import { useI18n } from "./lib/i18n";

export default function FamilyOnboarding({
  onCreate,
  onJoin,
  onSignOut,
  error,
}: {
  onCreate: (name: string) => void;
  onJoin: (code: string) => void;
  onSignOut: () => void;
  error?: string | null;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState(t("onboarding.defaultFamilyName"));
  const [code, setCode] = useState("");

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-background via-background to-primary/5 px-6 pt-10 font-sans text-foreground pb-10">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt={t("appName")} className="h-6 w-6 rounded-md shadow-sm" />
          <span className="text-xl font-extrabold tracking-tight text-primary">{t("appName")}</span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-muted-foreground hover:bg-chrome/60 active:bg-chrome"
        >
          <IconLogout size={18} stroke={2} />
          {t("onboarding.signOut")}
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center pb-20">
        {mode === "choose" && (
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconUsers size={36} stroke={1.5} />
            </div>
            <h1 className="text-center text-3xl font-extrabold leading-tight text-foreground tracking-tight">
              {t("onboarding.title")}
            </h1>
            <p className="mt-4 text-center text-[15px] font-medium leading-relaxed text-muted-foreground">
              {t("onboarding.subtitle")}
            </p>

            <div className="mt-12 flex w-full max-w-sm flex-col gap-4">
              <button
                type="button"
                onClick={() => setMode("create")}
                className="group flex items-center gap-4 rounded-2xl bg-surface p-5 border border-border/40 shadow-sm transition-all hover:border-primary/40 active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <IconUsers size={22} stroke={2} />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-base font-bold text-foreground">{t("onboarding.createTitle")}</span>
                  <span className="mt-0.5 text-[13px] font-medium text-muted-foreground group-hover:text-foreground/80">{t("onboarding.createDesc")}</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("join")}
                className="group flex items-center gap-4 rounded-2xl bg-surface p-5 border border-border/40 shadow-sm transition-all hover:border-foreground/20 active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-chrome text-foreground shadow-sm">
                  <IconUserPlus size={22} stroke={2} />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-base font-bold text-foreground">{t("onboarding.joinTitle")}</span>
                  <span className="mt-0.5 text-[13px] font-medium text-muted-foreground group-hover:text-foreground/80">{t("onboarding.joinDesc")}</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {mode === "create" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCreate(name.trim() || t("onboarding.defaultFamilyName"));
            }}
            className="flex w-full max-w-sm mx-auto flex-col gap-6"
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
            {error && <p className="text-[13px] font-bold text-danger text-center bg-danger/10 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-surface border border-border/60 text-[15px] font-bold text-foreground shadow-sm hover:bg-chrome transition-colors"
              >
                {t("common.back")}
              </button>
              <button
                type="submit"
                className="flex min-h-14 flex-[2] items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
              >
                {t("onboarding.createSubmit")}
              </button>
            </div>
          </form>
        )}

        {mode === "join" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onJoin(code.trim());
            }}
            className="flex w-full max-w-sm mx-auto flex-col gap-6"
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
            {error && <p className="text-[13px] font-bold text-danger text-center bg-danger/10 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-surface border border-border/60 text-[15px] font-bold text-foreground shadow-sm hover:bg-chrome transition-colors"
              >
                {t("common.back")}
              </button>
              <button
                type="submit"
                disabled={!code.trim()}
                className="flex min-h-14 flex-[2] items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-sm transition-transform disabled:bg-chrome disabled:text-muted-foreground disabled:shadow-none active:scale-[0.98]"
              >
                {t("onboarding.joinSubmit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
