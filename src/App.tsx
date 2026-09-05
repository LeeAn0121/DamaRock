import { useState, useEffect } from "react";
import HomeList from "./HomeList";
import AddItemSheet from "./AddItemSheet";
import SettingsPage from "./SettingsPage";
import FamilyInvite from "./FamilyInvite";
import AuthScreen from "./AuthScreen";
import FamilyOnboarding from "./FamilyOnboarding";
import GroupSwitcher from "./GroupSwitcher";
import { useAppData } from "./hooks/useAppData";
import { ToastContainer } from "./components/Toast";
import { LanguageProvider, useI18n, type LangSetting } from "./lib/i18n";
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

function AppShell() {
  const { t, setLanguage } = useI18n();
  const data = useAppData();
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

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      const request = () => {
        Notification.requestPermission();
        document.removeEventListener("click", request);
      };
      document.addEventListener("click", request);
    }
  }, []);

  if (data.status === "loading") {
    return <div className="min-h-dvh bg-background" />;
  }

  if (data.status === "signed-out") {
    return <AuthScreen />;
  }

  if (data.status === "needs-family") {
    return (
      <FamilyOnboarding
        onCreate={data.createFamily}
        onJoin={data.joinFamily}
        onSignOut={data.signOut}
        error={data.error}
      />
    );
  }

  if (data.status === "error") {
    return (
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
  }

  const addFromSheet = (item: Omit<Item, "id" | "done" | "created_at">) => {
    data.addItem({ title: item.title, category: item.category, assignee: item.assignee, meta: item.meta });
  };

  if (screen === "settings") {
    return (
      <SettingsPage
        familyName={data.family?.name ?? t("appName")}
        members={data.members}
        userId={data.userId}
        onBack={() => setScreen("home")}
        onOpenInvite={() => setScreen("invite")}
        onOpenGroups={() => setScreen("groups")}
        onSignOut={data.signOut}
        updateLanguage={data.updateLanguage}
        updateFamilyName={data.updateFamilyName}
        updateDisplayName={data.updateDisplayName}
      />
    );
  }

  if (screen === "groups") {
    return (
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
  }

  if (screen === "invite") {
    return (
      <FamilyInvite
        onRefreshCode={data.refreshInviteCode}
        family={data.family}
        members={data.members}
        invites={data.invites}
        onCancelInvite={data.cancelInvite}
        onBack={() => setScreen("settings")}
      />
    );
  }

  return (
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
        deleteItem={data.deleteItem}
        restoreItem={data.restoreItem}
        hardDeleteItem={data.hardDeleteItem}
        refreshData={data.refreshData}
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
