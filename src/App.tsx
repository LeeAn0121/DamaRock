import { useState } from "react";
import HomeList from "./HomeList";
import AddItemSheet from "./AddItemSheet";
import SettingsPage from "./SettingsPage";
import FamilyInvite from "./FamilyInvite";
import { INITIAL_ITEMS, type Category, type Item } from "./data";

type Screen = "home" | "settings" | "invite";

function useInitialScreen(): Screen {
  if (typeof window === "undefined") return "home";
  const v = new URLSearchParams(window.location.search).get("screen");
  if (v === "settings" || v === "invite") return v;
  return "home";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(useInitialScreen);
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [addSheetOpen, setAddSheetOpen] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("modal") === "add"
  );

  const toggleDone = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const assignCategory = (id: string, category: Category) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, category } : i)));
  };

  const quickAdd = (title: string) => {
    setItems((prev) => [
      { id: `d-${Date.now()}`, title, category: "inbox", done: false, addedBy: "me" },
      ...prev,
    ]);
  };

  const addFromSheet = (item: Omit<Item, "id" | "done">) => {
    setItems((prev) => [{ ...item, id: `d-${Date.now()}`, done: false }, ...prev]);
  };

  if (screen === "settings") {
    return <SettingsPage onBack={() => setScreen("home")} onOpenInvite={() => setScreen("invite")} />;
  }

  if (screen === "invite") {
    return <FamilyInvite onBack={() => setScreen("settings")} />;
  }

  return (
    <>
      <HomeList
        items={items}
        onToggleDone={toggleDone}
        onAssignCategory={assignCategory}
        onQuickAdd={quickAdd}
        onOpenAddSheet={() => setAddSheetOpen(true)}
        onOpenSettings={() => setScreen("settings")}
      />
      <AddItemSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} onSubmit={addFromSheet} />
    </>
  );
}
