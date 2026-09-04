import { useState } from "react";
import clsx from "clsx";
import { IconChevronLeft, IconChevronRight, IconLogout, IconUsers } from "@tabler/icons-react";
import { memberName, type Member } from "./data";

export default function SettingsPage({
  familyName,
  members,
  userId,
  onBack,
  onOpenInvite,
  onSignOut,
}: {
  familyName: string;
  members: Member[];
  userId: string | null;
  onBack: () => void;
  onOpenInvite: () => void;
  onSignOut: () => void;
}) {
  const [newItemAlerts, setNewItemAlerts] = useState(true);
  const [doneAlerts, setDoneAlerts] = useState(true);

  const me = members.find((m) => m.id === userId);

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <header className="flex items-center gap-1 border-b border-border/60 px-2 py-3">
          <button
            type="button"
            aria-label="뒤로"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-chrome/60 active:bg-chrome"
          >
            <IconChevronLeft size={20} stroke={1.75} />
          </button>
          <h1 className="text-base font-bold text-foreground">설정</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
          {/* Profile */}
          <section className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-chrome text-xl font-bold text-chrome-foreground">
              {me?.initial ?? "나"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold text-foreground">
                {memberName(members, userId ?? undefined)}
              </span>
              <span className="block text-sm text-muted-foreground">{me?.role ?? "가족 구성원"}</span>
            </span>
          </section>

          <SettingsGroup label="우리집">
            <SettingsRow label="가족 이름" trailing={<span className="text-sm text-muted-foreground">{familyName}</span>} />
            <SettingsRow
              label="가족 구성원"
              icon={<IconUsers size={17} stroke={1.75} />}
              onClick={onOpenInvite}
              trailing={
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {members.length}명
                  <span className="flex -space-x-1.5">
                    {members.map((m) => (
                      <span
                        key={m.id}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-chrome text-xs font-bold text-chrome-foreground"
                      >
                        {m.initial}
                      </span>
                    ))}
                  </span>
                </span>
              }
            />
          </SettingsGroup>

          <SettingsGroup label="알림">
            <SettingsRow
              label="새 항목 알림"
              trailing={<Switch checked={newItemAlerts} onChange={setNewItemAlerts} label="새 항목 알림" />}
            />
            <SettingsRow
              label="완료 알림"
              trailing={<Switch checked={doneAlerts} onChange={setDoneAlerts} label="완료 알림" />}
            />
          </SettingsGroup>

          <SettingsGroup label="계정">
            <SettingsRow
              label="로그아웃"
              icon={<IconLogout size={17} stroke={1.75} />}
              onClick={onSignOut}
              chevron={false}
            />
          </SettingsGroup>

          <p className="mt-8 text-center text-xs text-muted-foreground">담아락 v0.1.0</p>
        </main>
      </div>
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-sm font-bold text-muted-foreground">{label}</h2>
      <div className="divide-y divide-border/60 rounded-lg border border-border bg-surface">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  label,
  trailing,
  icon,
  onClick,
  chevron = true,
}: {
  label: string;
  trailing?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  chevron?: boolean;
}) {
  const interactive = Boolean(onClick);
  const Comp = interactive ? "button" : "div";
  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={clsx("flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left", interactive && "active:bg-chrome/40")}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="flex-1 text-base text-foreground">{label}</span>
      {trailing}
      {interactive && chevron && (
        <IconChevronRight size={16} stroke={1.75} className="text-muted-foreground" />
      )}
    </Comp>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-14 shrink-0 items-center justify-center"
    >
      <span className={clsx("relative h-7 w-12 rounded-full transition-colors", checked ? "bg-primary" : "bg-chrome")}>
        <span
          className={clsx(
            "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-surface shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
