import { useState } from "react";
import { IconCheck, IconChevronLeft, IconCopy, IconMail, IconShare2 } from "@tabler/icons-react";
import type { Family, Invite } from "./hooks/useAppData";
import type { Member } from "./data";
import { useI18n } from "./lib/i18n";

export default function FamilyInvite({
  family,
  members,
  userId,
  invites,
  onCancelInvite,
  onBack,
  onRefreshCode,
}: {
  family: Family | null;
  members: Member[];
  userId: string | null;
  invites: Invite[];
  onCancelInvite: (id: string) => void;
  onBack: () => void;
  onRefreshCode: () => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const code = family?.inviteCode ?? "";
  const inviteUrl = `${window.location.origin}${import.meta.env.BASE_URL}?join=${encodeURIComponent(code)}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard permission unavailable — the link is still visible on screen to copy manually
    }
  };

  const shareCode = async () => {
    const text = t("invite.shareText", { family: family?.name ?? t("onboarding.defaultFamilyName"), url: inviteUrl });
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled the share sheet — no action needed
      }
    } else {
      copyCode();
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-background via-background to-primary/5 font-sans text-foreground pb-10">
      <div className="mx-auto flex min-h-dvh w-full max-w-md md:max-w-2xl lg:max-w-4xl flex-col">
        <header className="flex items-center gap-1 border-b border-border/40 px-2 py-3 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <button
            type="button"
            aria-label={t("common.back")}
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-chrome/60 active:bg-chrome transition-colors"
          >
            <IconChevronLeft size={20} stroke={2} />
          </button>
          <h1 className="text-base font-extrabold text-foreground tracking-tight">{t("invite.header")}</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-10 pt-6">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-sm font-bold text-muted-foreground">{t("invite.sectionTitle")}</h2>
            <button onClick={() => onBack()} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
              {t("invite.manageGroup")}
            </button>
          </div>

          {/* Dominant invite block */}
          <section className="rounded-3xl bg-surface p-7 text-center shadow-sm border border-border/60">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              {t("invite.shareByCode")} <span className="text-xs text-danger/80">{t("invite.codeExpiry")}</span>
            </div>
            <p className="mt-3 text-5xl font-extrabold tracking-[0.1em] text-primary">{code}</p>
            <button onClick={() => onRefreshCode()} className="mt-2 mb-4 text-xs font-bold text-muted-foreground underline underline-offset-2 active:text-primary">
              {t("invite.refreshCode")}
            </button>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  const text = t("invite.kakaoShareText", { url: inviteUrl });

                  if (window.Kakao && window.Kakao.isInitialized()) {
                    window.Kakao.Share.sendDefault({
                      objectType: 'text',
                      text: text,
                      link: {
                        mobileWebUrl: window.location.href,
                        webUrl: window.location.href,
                      },
                    });
                  } else {
                    alert(t("invite.kakaoNotReady"));
                  }

                }}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-sm font-bold text-[#191919] shadow-sm transition-transform active:scale-[0.98]"
              >
                {t("invite.kakaoShare")}
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border/50 bg-background text-sm font-bold text-foreground shadow-sm transition-colors active:bg-chrome"
                >
                  {copied ? (
                    <>
                      <IconCheck size={18} stroke={3} className="text-success" />
                      <span className="text-success">{t("invite.copied")}</span>
                    </>
                  ) : (
                    <>
                      <IconCopy size={18} stroke={2} />
                      {t("invite.copyLink")}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={shareCode}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border/50 bg-background text-sm font-bold text-foreground shadow-sm transition-colors active:bg-chrome"
                >
                  <IconShare2 size={18} stroke={2} />
                  {t("invite.shareOther")}
                </button>
              </div>
            </div>
          </section>

          {/* Members */}
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2 px-2 text-muted-foreground">
              <h2 className="text-sm font-bold">{t("invite.membersSection")}</h2>
              <span className="text-sm text-border">·</span>
              <span className="text-sm font-medium">{members.length}</span>
            </div>
            <div className="rounded-2xl bg-surface px-2">
              <ul className="divide-y divide-border/40">
                {members.map((m) => {
                  const isMe = m.id === userId;
                  const roleLabel = m.role === "가족대표" ? t("role.leader") : t("role.member");
                  return (
                    <li key={m.id} className="flex items-center gap-4 px-3 py-3.5">
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-chrome text-base font-bold text-chrome-foreground shadow-sm overflow-hidden">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt={m.name} className="h-full w-full object-cover" />
                        ) : (
                          m.initial
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-base font-medium text-foreground">{m.name}</span>
                        <span className="block text-xs font-medium text-muted-foreground">
                          {roleLabel}{isMe ? ` · ${t("common.me")}` : ""}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Pending invites */}
          {invites.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-center gap-2 px-2 text-muted-foreground">
                <h2 className="text-sm font-bold">{t("invite.pendingSection")}</h2>
                <span className="text-sm text-border">·</span>
                <span className="text-sm font-medium">{invites.length}</span>
              </div>
              <div className="rounded-2xl bg-surface px-2">
                <ul className="divide-y divide-border/40">
                  {invites.map((invite) => (
                    <li key={invite.id} className="flex items-center gap-4 px-3 py-3.5">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-chrome/60 text-muted-foreground shadow-sm">
                        <IconMail size={20} stroke={2} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-base font-medium text-foreground">{invite.invitedName}</span>
                        <span className="block mt-0.5 text-xs font-medium text-muted-foreground">{t("invite.pendingDesc")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onCancelInvite(invite.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-bold text-muted-foreground hover:text-danger active:bg-chrome/60"
                      >
                        {t("common.cancel")}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
