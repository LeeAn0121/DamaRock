import { useState, useEffect } from "react";
import HomeList from "./HomeList";
import AddItemSheet from "./AddItemSheet";
import SettingsPage from "./SettingsPage";
import FamilyInvite from "./FamilyInvite";
import AuthScreen from "./AuthScreen";
import FamilyOnboarding from "./FamilyOnboarding";
import { useAppData } from "./hooks/useAppData";
import type { Category, Item } from "./data";

type Screen = "home" | "settings" | "invite";

function useInitialScreen(): Screen {
  if (typeof window === "undefined") return "home";
  const v = new URLSearchParams(window.location.search).get("screen");
  if (v === "settings" || v === "invite") return v as Screen;
  return "home";
}

export default function App() {
  const data = useAppData();
  const [screen, setScreen] = useState<Screen>(useInitialScreen);
  const [addSheetOpen, setAddSheetOpen] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("modal") === "add"
  );

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
        <p className="text-base font-bold text-foreground">문제가 생겼어요</p>
        <p className="text-sm text-muted-foreground">{data.error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          다시 시도
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
        familyName={data.family?.name ?? "담아락"}
        members={data.members}
        userId={data.userId}
        onBack={() => setScreen("home")}
        onOpenInvite={() => setScreen("invite")}
        onSignOut={data.signOut}
      />
    );
  }

  if (screen === "invite") {
    return (
      <FamilyInvite
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
    </>
  );
}
