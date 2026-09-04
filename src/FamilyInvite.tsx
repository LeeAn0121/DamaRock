import { useState } from "react";
import { IconCheck, IconChevronLeft, IconCopy, IconMail, IconShare2 } from "@tabler/icons-react";
import type { Family, Invite } from "./hooks/useAppData";
import type { Member } from "./data";

export default function FamilyInvite({
  family,
  members,
  invites,
  onCancelInvite,
  onBack,
}: {
  family: Family | null;
  members: Member[];
  invites: Invite[];
  onCancelInvite: (id: string) => void;
  onBack: () => void;
}) {
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
    const text = `담아락 "${family?.name ?? "우리집"}"에 초대할게요! 아래 링크를 열면 바로 들어올 수 있어요.\n${inviteUrl}`;
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
            aria-label="뒤로"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-chrome/60 active:bg-chrome transition-colors"
          >
            <IconChevronLeft size={20} stroke={2} />
          </button>
          <h1 className="text-base font-extrabold text-foreground tracking-tight">가족 구성원</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-10 pt-6">
          {/* Dominant invite block */}
          <section className="rounded-3xl bg-surface p-7 text-center shadow-sm border border-border/60">
            <p className="text-sm font-medium text-muted-foreground">이 코드로 우리집에 초대하세요</p>
            <p className="mt-3 text-5xl font-extrabold tracking-[0.1em] text-primary">{code}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={copyCode}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-border/50 bg-background text-sm font-bold text-foreground shadow-sm transition-colors active:bg-chrome"
              >
                {copied ? (
                  <>
                    <IconCheck size={18} stroke={3} className="text-success" />
                    <span className="text-success">복사됨</span>
                  </>
                ) : (
                  <>
                    <IconCopy size={18} stroke={2} />
                    코드 복사
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={shareCode}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
              >
                <IconShare2 size={18} stroke={2} />
                공유하기
              </button>
            </div>
          </section>

          {/* Members */}
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2 px-2 text-muted-foreground">
              <h2 className="text-sm font-bold">구성원</h2>
              <span className="text-sm text-border">·</span>
              <span className="text-sm font-medium">{members.length}</span>
            </div>
            <div className="rounded-2xl bg-surface px-2">
              <ul className="divide-y divide-border/40">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-4 px-3 py-3.5">
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-chrome text-base font-bold text-chrome-foreground shadow-sm overflow-hidden">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={m.name} className="h-full w-full object-cover" />
                      ) : (
                        m.initial
                      )}
                      {m.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-success z-10" />
                      )}
                    </span>
                    <span className="flex-1 text-base font-medium text-foreground">{m.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Pending invites */}
          {invites.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-center gap-2 px-2 text-muted-foreground">
                <h2 className="text-sm font-bold">초대 대기 중</h2>
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
                        <span className="block mt-0.5 text-xs font-medium text-muted-foreground">코드 공유함 · 아직 참여 전</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onCancelInvite(invite.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-bold text-muted-foreground hover:text-danger active:bg-chrome/60"
                      >
                        취소
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
