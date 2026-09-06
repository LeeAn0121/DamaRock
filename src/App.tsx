import { useState, useEffect } from "react";
import HomeList, { LoadingState } from "./HomeList";
import AddItemSheet from "./AddItemSheet";
import SettingsPage from "./SettingsPage";
import FamilyInvite from "./FamilyInvite";
import AuthScreen from "./AuthScreen";
import FamilyOnboarding from "./FamilyOnboarding";
import GroupSwitcher from "./GroupSwitcher";
import { useAppData } from "./hooks/useAppData";
import { ToastContainer } from "./components/Toast";
import { LanguageProvider, useI18n, type LangSetting } from "./lib/i18n";
import { subscribeToPush } from "./lib/push";
import { onUpdateAvailable } from "./lib/swUpdate";
import { useNotificationPermission } from "./hooks/useNotificationPermission";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import type { Category, Item } from "./data";

type Screen = "home" | "settings" | "invite" | "groups";

function useInitialScreen(): Screen {
  if (typeof window === "undefined") return "home";
  const v = new URLSearchParams(window.location.search).get("screen");
  if (v === "settings" || v === "invite" || v === "groups") return v as Screen;
  return "home";
}

export default function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}

function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return isOnline;
}

function OfflineBanner() {
  const { t } = useI18n();
  return (
    <div className="sticky top-0 z-[200] animate-in fade-in slide-in-from-top-2 bg-danger px-4 py-1.5 text-center text-xs font-bold text-danger-foreground duration-300">
      {t("app.offlineBanner")}
    </div>
  );
}

function useUpdateAvailable(): (() => void) | null {
  const [apply, setApply] = useState<(() => void) | null>(null);
  useEffect(() => onUpdateAvailable((fn) => setApply(() => fn)), []);
  return apply;
}

function UpdateBanner({ onApply }: { onApply: () => void }) {
  const { t } = useI18n();
  return (
    <div className="sticky top-0 z-[200] flex animate-in fade-in slide-in-from-top-2 items-center justify-center gap-3 bg-primary px-4 py-1.5 text-center text-xs font-bold text-primary-foreground duration-300">
      <span>{t("app.updateAvailable")}</span>
      <button
        type="button"
        onClick={onApply}
        className="rounded-full bg-primary-foreground/20 px-3 py-0.5 underline-offset-2 hover:underline"
      >
        {t("app.updateNow")}
      </button>
    </div>
  );
}

function NotificationPermissionBanner({
  permission,
  onAllow,
  onDismiss,
  needsIOSInstall,
}: {
  permission: "default" | "granted" | "denied" | "unsupported";
  onAllow: () => void;
  onDismiss: () => void;
  needsIOSInstall: boolean;
}) {
  const { t } = useI18n();
  if (permission !== "default") return null;

  return (
    <div className="sticky top-0 z-[200] flex animate-in fade-in slide-in-from-top-2 items-center justify-center gap-3 bg-foreground px-4 py-1.5 text-center text-xs font-bold text-background duration-300">
      <span>{needsIOSInstall ? t("app.iosInstallForNotif") : t("app.enableNotif")}</span>
      {!needsIOSInstall && (
        <button
          type="button"
          onClick={onAllow}
          className="rounded-full bg-background/20 px-3 py-0.5 underline-offset-2 hover:underline"
        >
          {t("app.allow")}
        </button>
      )}
      <button type="button" onClick={onDismiss} className="text-background/70">
        ✕
      </button>
    </div>
  );
}

function AppShell() {
  const { t, setLanguage } = useI18n();
  const data = useAppData();
  const isOnline = useIsOnline();
  const applyUpdate = useUpdateAvailable();
  const { isIOS, isAppInstalled } = useInstallPrompt();
  const notif = useNotificationPermission(data.userId);
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("notifBannerDismissed") === "true"
  );
  const [screen, setScreen] = useState<Screen>(useInitialScreen);
  const [addSheetOpen, setAddSheetOpen] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("modal") === "add"
  );

  const me = data.members.find((m) => m.id === data.userId);

  // Once the account's saved language preference is known, reconcile it
  // with whatever this device currently has (cross-device sync).
  useEffect(() => {
    if (me?.language) setLanguage(me.language as LangSetting);
  }, [me?.language, setLanguage]);

  // Re-subscribe on every load (idempotent — getSubscription() returns the
  // existing one if still valid) so a renewed/expired subscription self-heals
  // without the user having to do anything.
  useEffect(() => {
    if (!data.userId) return;
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      subscribeToPush(data.userId);
    }
  }, [data.userId]);

  const dismissNotifBanner = () => {
    localStorage.setItem("notifBannerDismissed", "true");
    setNotifBannerDismissed(true);
  };

  const addFromSheet = (item: Omit<Item, "id" | "done" | "created_at">) => {
    data.addItem({ title: item.title, category: item.category, assignee: item.assignee, meta: item.meta });
  };

  let content: React.ReactNode;

  if (data.status === "loading") {
    content = <LoadingState />;
  } else if (data.status === "signed-out") {
    content = <AuthScreen />;
  } else if (data.status === "needs-family") {
    content = (
      <FamilyOnboarding
        onCreate={data.createFamily}
        onJoin={data.joinFamily}
        onSignOut={data.signOut}
        error={data.error}
      />
    );
  } else if (data.status === "error") {
    content = (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center font-sans">
        <p className="text-base font-bold text-foreground">{t("app.errorTitle")}</p>
        <p className="text-sm text-muted-foreground">{data.error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  } else if (screen === "settings") {
    content = (
      <SettingsPage
        familyName={data.family?.name ?? t("appName")}
        familyCreatedAt={data.family?.createdAt ?? null}
        members={data.members}
        userId={data.userId}
        onBack={() => setScreen("home")}
        onOpenInvite={() => setScreen("invite")}
        onOpenGroups={() => setScreen("groups")}
        onSignOut={data.signOut}
        updateLanguage={data.updateLanguage}
        updateFamilyName={data.updateFamilyName}
        updateDisplayName={data.updateDisplayName}
        syncNotificationSettings={data.syncNotificationSettings}
      />
    );
  } else if (screen === "groups") {
    content = (
      <GroupSwitcher
        families={data.families}
        activeFamilyId={data.family?.id ?? null}
        onSwitch={data.switchFamily}
        onCreate={data.createFamily}
        onJoin={data.joinFamily}
        onBack={() => setScreen("settings")}
        error={data.error}
      />
    );
  } else if (screen === "invite") {
    content = (
      <FamilyInvite
        onRefreshCode={data.refreshInviteCode}
        family={data.family}
        members={data.members}
        userId={data.userId}
        invites={data.invites}
        onCancelInvite={data.cancelInvite}
        onBack={() => setScreen("settings")}
      />
    );
  } else {
    content = (
      <>
        <HomeList
          items={data.items}
          comments={data.comments}
          members={data.members}
          userId={data.userId}
          familyId={data.family?.id ?? null}
          onToggleDone={data.toggleDone}
          onAssignCategory={(id: string, category: Category) => data.assignCategory(id, category)}
          onQuickAdd={data.quickAdd}
          addItem={data.addItem}
          editItem={data.editItem}
          moveItems={data.moveItems}
          onOpenAddSheet={() => setAddSheetOpen(true)}
          onOpenSettings={() => setScreen("settings")}
          onOpenInvite={() => setScreen("invite")}
          typingByContext={data.typingByContext}
          notifyTyping={data.notifyTyping}
          deleteItem={data.deleteItem}
          restoreItem={data.restoreItem}
          hardDeleteItem={data.hardDeleteItem}
          hasUnreadActivity={data.hasUnreadActivity}
          clearUnreadActivity={data.clearUnreadActivity}
        />
        <AddItemSheet
          open={addSheetOpen}
          members={data.members}
          onClose={() => setAddSheetOpen(false)}
          onSubmit={addFromSheet}
        />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      {applyUpdate && <UpdateBanner onApply={applyUpdate} />}
      {!isOnline && <OfflineBanner />}
      {data.status === "ready" && !notifBannerDismissed && (
        <NotificationPermissionBanner
          permission={notif.permission}
          onAllow={notif.request}
          onDismiss={dismissNotifBanner}
          needsIOSInstall={isIOS && !isAppInstalled}
        />
      )}
      {content}
    </>
  );
}
