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
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="rounded-b-[32px] bg-primary px-2 pt-6 pb-16">
          <header className="flex items-center gap-1">
            <button
              type="button"
              aria-label="뒤로"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full text-primary-foreground/80 hover:bg-primary-foreground/10 active:bg-primary-foreground/15"
            >
              <IconChevronLeft size={20} stroke={1.75} />
            </button>
            <h1 className="text-base font-bold text-primary-foreground">가족 구성원</h1>
          </header>
        </div>

        <main className="flex-1 overflow-y-auto px-4 pb-10">
          {/* Dominant invite block */}
          <section className="relative -mt-4 rounded-2xl bg-surface p-5 text-center shadow-[0_12px_32px_-10px_rgba(20,40,30,0.35)]">
            <p className="text-sm text-muted-foreground">이 코드로 우리집에 초대하세요</p>
            <p className="mt-2 text-4xl font-bold tracking-[0.08em] text-primary">{code}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={copyCode}
                className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full border border-border text-sm font-bold text-foreground transition-colors active:bg-chrome"
              >
                {copied ? (
                  <>
                    <IconCheck size={16} stroke={2.5} className="text-success" />
                    복사됨
                  </>
                ) : (
                  <>
                    <IconCopy size={16} stroke={1.75} />
                    코드 복사
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={shareCode}
                className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
              >
                <IconShare2 size={16} stroke={1.75} />
                공유하기
              </button>
            </div>
          </section>

          {/* Members */}
          <section className="mt-6">
            <div className="mb-2 flex items-center gap-2 px-1 text-muted-foreground">
              <h2 className="text-sm font-bold">구성원</h2>
              <span className="text-sm text-border">·</span>
              <span className="text-sm">{members.length}</span>
            </div>
            <div className="rounded-2xl border border-border/60 bg-surface">
              <ul className="divide-y divide-border/60">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-chrome text-sm font-bold text-chrome-foreground">
                      {m.initial}
                      {m.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
                      )}
                    </span>
                    <span className="flex-1 text-base text-foreground">{m.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Pending invites */}
          {invites.length > 0 && (
            <section className="mt-6">
              <div className="mb-2 flex items-center gap-2 px-1 text-muted-foreground">
                <h2 className="text-sm font-bold">초대 대기 중</h2>
                <span className="text-sm text-border">·</span>
                <span className="text-sm">{invites.length}</span>
              </div>
              <div className="rounded-2xl border border-border/60 bg-surface">
                <ul className="divide-y divide-border/60">
                  {invites.map((invite) => (
                    <li key={invite.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-chrome/60 text-muted-foreground">
                        <IconMail size={17} stroke={1.75} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-base text-foreground">{invite.invitedName}</span>
                        <span className="block text-xs text-muted-foreground">코드 공유함 · 아직 참여 전</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onCancelInvite(invite.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-xs text-muted-foreground hover:text-danger active:bg-chrome/60"
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
