import { useState, useEffect } from "react";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import { useNotificationPermission } from "./hooks/useNotificationPermission";
import clsx from "clsx";
import {
  IconChevronLeft, IconChevronRight, IconLogout, IconUsers,
  IconPalette, IconLanguage, IconCalendar, IconHandMove,
  IconTrash, IconUserEdit, IconMoon, IconSun, IconEdit, IconDownload,
  IconCheck, IconExternalLink, IconDeviceMobile
} from "@tabler/icons-react";
import { memberName, type Member } from "./data";
import { useI18n, type LangSetting } from "./lib/i18n";

const THEMES: { id: string; nameKey: string; bg: string; primary: string }[] = [
  { id: "clean-blue", nameKey: "theme.clean-blue", bg: "#F0F6FF", primary: "#2563EB" },
  { id: "bonfire", nameKey: "theme.bonfire", bg: "#FFF5EE", primary: "#E05A2B" },
  { id: "ink", nameKey: "theme.ink", bg: "#F8FAFC", primary: "#0F172A" },
  { id: "dark", nameKey: "theme.dark", bg: "#121212", primary: "#3B82F6" },
  { id: "postit", nameKey: "theme.postit", bg: "#FEF7D0", primary: "#D97706" },
  { id: "beige-navy", nameKey: "theme.beige-navy", bg: "#F8F2ED", primary: "#1E3A8A" },
  { id: "lavender", nameKey: "theme.lavender", bg: "#F5F3FF", primary: "#7C3AED" },
  { id: "forest", nameKey: "theme.forest", bg: "#F0FDF4", primary: "#16A34A" },
  { id: "cherry", nameKey: "theme.cherry", bg: "#FFF1F2", primary: "#E11D48" },
  { id: "mint", nameKey: "theme.mint", bg: "#ECFEFF", primary: "#0891B2" },
  { id: "grape-dark", nameKey: "theme.grape-dark", bg: "#1A1025", primary: "#A855F7" },
];

// A reusable switch component
function Switch({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        checked ? "bg-primary" : "bg-chrome-foreground/20"
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

// Reusable settings group component
function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 pl-2 text-sm font-bold text-muted-foreground">{label}</h2>
      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm border border-border/40">
        <ul className="divide-y divide-border/60">{children}</ul>
      </div>
    </section>
  );
}

// Reusable settings row component
function SettingsRow({
  icon,
  label,
  description,
  trailing,
  onClick,
  destructive
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const isButton = !!onClick;
  const Wrapper = isButton ? "button" : "div";
  return (
    <li className="flex min-h-[56px] items-center gap-4 px-4 py-2 relative">
      {isButton && (
        <Wrapper
          onClick={onClick}
          className="absolute inset-0 z-0 h-full w-full bg-transparent transition-colors hover:bg-chrome/40 active:bg-chrome/60"
        />
      )}
      {icon && (
        <div className={clsx("relative z-10 shrink-0", destructive ? "text-danger" : "text-primary/80")}>
          {icon}
        </div>
      )}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col py-1">
        <span className={clsx("truncate text-[15px] font-bold", destructive ? "text-danger" : "text-foreground")}>
          {label}
        </span>
        {description && <span className="text-xs text-muted-foreground mt-0.5">{description}</span>}
      </div>
      {trailing && <div className="relative z-10 shrink-0 ml-4">{trailing}</div>}
      {isButton && !trailing && (
        <div className="relative z-10 shrink-0 text-muted-foreground/50">
          <IconChevronRight size={20} stroke={2} />
        </div>
      )}
    </li>
  );
}

export default function SettingsPage({
  familyName,
  familyCreatedAt,
  members,
  userId,
  onBack,
  onOpenInvite,
  onOpenGroups,
  onSignOut,
  updateLanguage,
  updateFamilyName,
  updateDisplayName,
  syncNotificationSettings,
}: {
  familyName: string;
  familyCreatedAt: string | null;
  members: Member[];
  userId: string | null;
  onBack: () => void;
  onOpenInvite: () => void;
  onOpenGroups: () => void;
  onSignOut: () => void;
  updateLanguage: (lang: string) => void;
  updateFamilyName: (name: string) => void;
  updateDisplayName: (name: string) => void;
  syncNotificationSettings: (partial: {
    notifyNewItem?: boolean;
    notifyComments?: boolean;
    notifyBriefing?: boolean;
    briefingTime?: string;
    notifySummary?: boolean;
    quietMode?: boolean;
    quietStart?: string;
    quietEnd?: string;
  }) => void;
}) {
  const { t, setting: langSetting, setLanguage } = useI18n();
  const me = members.find(m => m.id === userId);
  const daysTogether = familyCreatedAt
    ? Math.max(1, Math.floor((Date.now() - new Date(familyCreatedAt).getTime()) / 86400000) + 1)
    : null;

  // Push Notifications Settings
  const [notifyNewItem, setNotifyNewItem] = useState(() => localStorage.getItem("notifyNewItem") !== "false");
  const [notifyComments, setNotifyComments] = useState(() => localStorage.getItem("notifyComments") !== "false");
  const [notifyBriefing, setNotifyBriefing] = useState(() => localStorage.getItem("notifyBriefing") !== "false");
  const { isInstallable, isAppInstalled, promptInstall, isIOS, isInAppBrowser } = useInstallPrompt();
  const notifPerm = useNotificationPermission(userId);
  const iosNeedsInstall = isIOS && !isAppInstalled;
  const [briefingTime, setBriefingTime] = useState(() => localStorage.getItem("briefingTime") || "08:00");
  const [notifySummary, setNotifySummary] = useState(() => localStorage.getItem("notifySummary") !== "false");
  const [quietMode, setQuietMode] = useState(() => localStorage.getItem("quietMode") === "true");
  const [quietStart, setQuietStart] = useState(() => localStorage.getItem("quietStart") || "23:00");
  const [quietEnd, setQuietEnd] = useState(() => localStorage.getItem("quietEnd") || "07:00");

  const handleEditFamilyName = async () => {
    const newName = window.prompt(t("settings.editFamilyNamePrompt"), familyName);
    if (newName && newName.trim() !== "" && newName !== familyName) {
      if (updateFamilyName) await updateFamilyName(newName.trim());
    }
  };

  const handleEditDisplayName = async () => {
    const current = memberName(members, userId ?? undefined);
    const newName = window.prompt(t("settings.editNamePrompt"), current);
    if (newName && newName.trim() !== "" && newName.trim() !== current) {
      await updateDisplayName(newName.trim());
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as LangSetting;
    setLanguage(val);
    updateLanguage(val);
  };
  const [holiday, setHoliday] = useState(() => localStorage.getItem("holiday") || "auto");

  // Interaction
  const [swipeAction, setSwipeAction] = useState(() => localStorage.getItem("swipeAction") === "true");

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "clean-blue");

  useEffect(() => {
    localStorage.setItem("notifyNewItem", String(notifyNewItem));
    localStorage.setItem("notifyComments", String(notifyComments));
    localStorage.setItem("notifyBriefing", String(notifyBriefing));
    localStorage.setItem("briefingTime", briefingTime);
    localStorage.setItem("notifySummary", String(notifySummary));
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("quietMode", String(quietMode));
    localStorage.setItem("quietStart", quietStart);
    localStorage.setItem("quietEnd", quietEnd);
    localStorage.setItem("holiday", holiday);
    localStorage.setItem("swipeAction", String(swipeAction));
    syncNotificationSettings({
      notifyNewItem, notifyComments, notifyBriefing, briefingTime, notifySummary,
      quietMode, quietStart, quietEnd,
    });
  }, [
    notifyNewItem, notifyComments, notifyBriefing, briefingTime, notifySummary,
    quietMode, quietStart, quietEnd, holiday, swipeAction, theme
  ]);

  const appVersion = `v${__APP_VERSION__}`;

  // Account login provider display (last login)
  const lastProvider = localStorage.getItem('lastLoginProvider');
  const providerDisplay = lastProvider === 'kakao' ? t("settings.providerKakao") : lastProvider === 'google' ? t("settings.providerGoogle") : t("settings.providerEmail");

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md md:max-w-2xl lg:max-w-4xl flex-col">
        <header className="flex items-center gap-1 border-b border-border/60 px-2 py-3">
          <button
            type="button"
            aria-label={t("common.back")}
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-chrome/60 active:bg-chrome"
          >
            <IconChevronLeft size={20} stroke={1.75} />
          </button>
          <h1 className="text-base font-bold text-foreground">{t("settings.header")}</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-10 pt-4">

          {/* Profile Section */}
          <section className="flex flex-col gap-4 rounded-2xl bg-surface p-5 mb-8 border border-border/40 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-chrome text-2xl font-bold text-chrome-foreground shadow-sm overflow-hidden border-2 border-primary/10">
                {me?.avatar_url ? (
                  <img src={me.avatar_url} alt={me.name} className="h-full w-full object-cover" />
                ) : (
                  me?.initial ?? t("common.me")
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-bold text-foreground flex items-center gap-2">
                  {memberName(members, userId ?? undefined)}
                  <button className="text-muted-foreground hover:text-primary transition-colors p-1" onClick={handleEditDisplayName}><IconUserEdit size={16} stroke={2}/></button>
                </span>
                <span className="block text-sm font-medium text-muted-foreground">
                  {me?.role === "가족대표" ? t("role.leader") : me?.role === "구성원" ? t("role.member") : t("settings.role")}
                </span>
              </span>
            </div>
            <div className="mt-2 rounded-xl bg-chrome/50 p-3 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t("settings.loginMethod")}</span>
              <span className="font-bold flex items-center gap-1">
                {providerDisplay} {me && <span className="opacity-60 font-normal">({me.name})</span>}
              </span>
            </div>
          </section>

          {/* App install — always shown, guidance adapts to what the current browser can actually do */}
          <SettingsGroup label={t("settings.installGroup")}>
            {isAppInstalled ? (
              <SettingsRow
                label={t("settings.installedLabel")}
                description={t("settings.installedDesc")}
                icon={<IconCheck size={18} stroke={2} />}
              />
            ) : isInstallable ? (
              <SettingsRow
                label={t("settings.installLabel")}
                icon={<IconDownload size={18} stroke={2} />}
                onClick={promptInstall}
              />
            ) : isInAppBrowser ? (
              <SettingsRow
                label={t("settings.installInAppLabel")}
                description={t("settings.installInAppDesc")}
                icon={<IconExternalLink size={18} stroke={2} />}
              />
            ) : isIOS ? (
              <SettingsRow
                label={t("settings.installIOSLabel")}
                description={t("settings.installIOSDesc")}
                icon={<IconDeviceMobile size={18} stroke={2} />}
              />
            ) : (
              <SettingsRow
                label={t("settings.installUnsupportedLabel")}
                description={t("settings.installUnsupportedDesc")}
                icon={<IconDeviceMobile size={18} stroke={2} />}
              />
            )}
          </SettingsGroup>

          <SettingsGroup label={t("settings.groupManagement")}>
            <SettingsRow
              label={t("settings.familyName")}
              onClick={handleEditFamilyName}
              trailing={<span className="text-sm font-medium text-primary">{familyName} <IconEdit className="inline" size={14}/></span>}
            />
            {daysTogether !== null && (
              <SettingsRow
                label={t("settings.timeTogether")}
                description={t("settings.timeTogetherDesc")}
                trailing={<span className="text-sm font-bold text-muted-foreground text-right">{t("settings.daysTogether", { n: daysTogether })}</span>}
              />
            )}
            <SettingsRow
              label={t("settings.groupMembers")}
              description={t("settings.memberCount", { n: members.length })}
              icon={<IconUsers size={18} stroke={2} />}
              onClick={onOpenInvite}
              trailing={
                <span className="flex -space-x-2">
                  {members.map((m) => (
                    <span
                      key={m.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-chrome text-[10px] font-bold text-chrome-foreground overflow-hidden shadow-sm"
                    >
                      {m.avatar_url ? <img src={m.avatar_url} alt={m.name} className="h-full w-full object-cover" /> : m.initial}
                    </span>
                  ))}
                </span>
              }
            />
            <SettingsRow
              label={t("settings.switchGroup")}
              description={t("settings.switchGroupDesc")}
              icon={<IconUsers size={18} stroke={2} />}
              onClick={onOpenGroups}
            />
          </SettingsGroup>

          {/* Theme */}
          <SettingsGroup label={t("settings.themeGroup")}>
            <li className="px-4 py-4">
              <span className="mb-3 flex items-center gap-2 text-[15px] font-bold text-foreground">
                <IconPalette size={18} stroke={2} className="text-primary/80" />
                {t("settings.designTheme")}
              </span>
              <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 scrollbar-hide">
                {THEMES.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className="flex shrink-0 flex-col items-center gap-1.5"
                  >
                    <span
                      className={clsx(
                        "flex h-12 w-12 items-center justify-center rounded-full shadow-sm ring-2 ring-offset-2 ring-offset-surface transition-all",
                        theme === opt.id ? "ring-primary scale-105" : "ring-transparent"
                      )}
                      style={{ background: `linear-gradient(135deg, ${opt.bg} 50%, ${opt.primary} 50%)` }}
                    >
                      {theme === opt.id && (
                        <IconCheck size={16} stroke={3} className="text-white drop-shadow" />
                      )}
                    </span>
                    <span
                      className={clsx(
                        "whitespace-nowrap text-[11px] font-medium",
                        theme === opt.id ? "font-bold text-primary" : "text-muted-foreground"
                      )}
                    >
                      {t(opt.nameKey)}
                    </span>
                  </button>
                ))}
              </div>
            </li>
          </SettingsGroup>

          {/* Notifications */}
          <SettingsGroup label={t("settings.notificationGroup")}>
            <SettingsRow
              label={t("settings.notifPermission")}
              description={
                iosNeedsInstall ? t("settings.notifPermissionIOS")
                : notifPerm.permission === "granted" ? t("settings.notifPermissionGranted")
                : notifPerm.permission === "denied" ? t("settings.notifPermissionDenied")
                : notifPerm.permission === "unsupported" ? t("settings.notifPermissionUnsupported")
                : undefined
              }
              trailing={
                !iosNeedsInstall && notifPerm.permission === "default" ? (
                  <button
                    type="button"
                    onClick={notifPerm.request}
                    className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full"
                  >
                    {t("settings.enableNotifButton")}
                  </button>
                ) : notifPerm.permission === "granted" ? (
                  <IconCheck size={18} stroke={2.5} className="text-primary" />
                ) : undefined
              }
            />
            <div className="border-t border-border/40 mx-4" />
            <SettingsRow
              label={t("settings.notifyNewItem")}
              trailing={<Switch checked={notifyNewItem} onChange={setNotifyNewItem} />}
            />
            <SettingsRow
              label={t("settings.notifyComments")}
              trailing={<Switch checked={notifyComments} onChange={setNotifyComments} />}
            />
            <SettingsRow
              label={t("settings.notifyBriefing")}
              description={t("settings.notifyBriefingDesc")}
              trailing={
                <div className="flex items-center gap-3">
                  {notifyBriefing && <input type="time" value={briefingTime} onChange={e => setBriefingTime(e.target.value)} className="bg-chrome text-sm p-1 rounded-md" />}
                  <Switch checked={notifyBriefing} onChange={setNotifyBriefing} />
                </div>
              }
            />
            <SettingsRow
              label={t("settings.notifySummary")}
              trailing={<Switch checked={notifySummary} onChange={setNotifySummary} />}
            />
            <div className="border-t border-border/40 mx-4" />
            <SettingsRow
              label={t("settings.quietMode")}
              description={t("settings.quietModeDesc")}
              icon={<IconMoon size={18} stroke={2} />}
              trailing={<Switch checked={quietMode} onChange={setQuietMode} />}
            />
            {quietMode && (
              <li className="flex items-center justify-between px-10 py-3 bg-chrome/30 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><IconMoon size={16}/> {t("settings.quietStart")} <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} className="bg-chrome px-2 py-1 rounded-md ml-2"/></div>
                <div className="flex items-center gap-2 text-muted-foreground"><IconSun size={16}/> {t("settings.quietEnd")} <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} className="bg-chrome px-2 py-1 rounded-md ml-2"/></div>
              </li>
            )}
          </SettingsGroup>

          {/* Regional Settings */}
          <SettingsGroup label={t("settings.regionGroup")}>
            <SettingsRow
              label={t("settings.languageLabel")}
              icon={<IconLanguage size={18} stroke={2} />}
              trailing={
                <select value={langSetting} onChange={handleLanguageChange} className="bg-chrome text-sm font-bold py-1.5 px-3 rounded-lg outline-none text-foreground">
                  <option value="auto">{t("settings.langAuto")}</option>
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              }
            />
            <SettingsRow
              label={t("settings.holidayLabel")}
              icon={<IconCalendar size={18} stroke={2} />}
              trailing={
                <select value={holiday} onChange={e => setHoliday(e.target.value)} className="bg-chrome text-sm font-bold py-1.5 px-3 rounded-lg outline-none text-foreground">
                  <option value="auto">{t("settings.holidayAuto")}</option>
                  <option value="KR">{t("holiday.kr")}</option>
                  <option value="US">{t("holiday.us")}</option>
                  <option value="JP">{t("holiday.jp")}</option>
                  <option value="CN">{t("holiday.cn")}</option>
                </select>
              }
            />
          </SettingsGroup>

          {/* Interactions */}
          <SettingsGroup label={t("settings.additionalGroup")}>
            <SettingsRow
              label={t("settings.swipeAction")}
              description={t("settings.swipeActionDesc")}
              icon={<IconHandMove size={18} stroke={2} />}
              trailing={<Switch checked={swipeAction} onChange={setSwipeAction} />}
            />
          </SettingsGroup>

          {/* Danger Zone */}
          <SettingsGroup label={t("settings.accountGroup")}>
            <SettingsRow
              label={t("settings.signOut")}
              icon={<IconLogout size={18} stroke={2} />}
              onClick={onSignOut}
            />
            <SettingsRow
              label={t("settings.deleteAccount")}
              icon={<IconTrash size={18} stroke={2} />}
              destructive
              onClick={() => {
                if (window.confirm(t("settings.confirmDeleteAccount"))) {
                  alert(t("settings.deleteAccountUnavailable"));
                }
              }}
            />
          </SettingsGroup>

          <div className="mt-8 flex justify-center pb-8">
            <span className="text-sm font-medium text-muted-foreground/60">{t("appName")} {appVersion}</span>
          </div>
        </main>
      </div>
    </div>
  );
}
