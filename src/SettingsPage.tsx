import { useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, Users } from "lucide-react";
import type { Member } from "./data";

export default function SettingsPage({
  familyName,
  members,
  onBack,
  onOpenInvite,
  onSignOut,
}: {
  familyName: string;
  members: Member[];
  onBack: () => void;
  onOpenInvite: () => void;
  onSignOut: () => void;
}) {
  const [newItemAlerts, setNewItemAlerts] = useState(true);
  const [doneAlerts, setDoneAlerts] = useState(true);

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <header className="flex items-center gap-1 px-2 pt-6">
          <button
            type="button"
            aria-label="뒤로"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-chrome/60 active:bg-chrome"
          >
            <ChevronLeft size={20} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-bold text-foreground">설정</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
          <SettingsGroup label="우리집">
            <SettingsRow label="가족 이름" trailing={<span className="text-sm text-muted-foreground">{familyName}</span>} />
            <SettingsRow
              label="가족 구성원"
              icon={<Users size={17} strokeWidth={1.75} />}
              onClick={onOpenInvite}
              trailing={
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {members.length}명
                  <span className="flex -space-x-1.5">
                    {members.map((m) => (
                      <span
                        key={m.id}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-chrome text-xs font-semibold text-chrome-foreground"
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
              icon={<LogOut size={17} strokeWidth={1.75} />}
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
    <section className="mt-6 first:mt-2">
      <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">{label}</h2>
      <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-surface">
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
      className={`flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left ${
        interactive ? "active:bg-chrome/40" : ""
      }`}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="flex-1 text-base text-foreground">{label}</span>
      {trailing}
      {interactive && chevron && (
        <ChevronRight size={16} strokeWidth={1.75} className="text-muted-foreground" />
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
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-chrome"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-surface shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
