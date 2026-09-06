import { useState, useMemo } from "react";
import { IconX } from "@tabler/icons-react";
import type { Item } from "./data";
import { useI18n } from "./lib/i18n";
import TypingIndicator from "./components/TypingIndicator";
import clsx from "clsx";

type Folder = { id: string; name: string; icon: string };

export default function AddGrocerySheet({
  open,
  items,
  onClose,
  onAdd,
  typingUsers = {},
  onTyping,
}: {
  open: boolean;
  items: Item[]; // to parse folders
  onClose: () => void;
  onAdd: (folderId: string, title: string, memo: string) => void;
  typingUsers?: Record<string, string>;
  onTyping?: () => void;
}) {
  const { t } = useI18n();
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");

  const folders: Folder[] = useMemo(() => {
    const systemItem = items.find((i) => i.title === "__SYSTEM_FOLDERS__");
    if (!systemItem?.meta) return [];
    try {
      return JSON.parse(systemItem.meta) as Folder[];
    } catch {
      return [];
    }
  }, [items]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(selectedFolder, title.trim(), memo.trim());
    setTitle("");
    setMemo("");
    setSelectedFolder("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex flex-col justify-end bg-black/40 animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose} />
      <div className="bg-surface rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-lg font-bold text-foreground">{t("addGrocery.title")}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-chrome rounded-full transition-colors active:scale-95">
            <IconX size={24} stroke={2} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">{t("addGrocery.chooseFolder")}</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedFolder("")}
                className={clsx("px-4 py-2 rounded-xl text-sm font-bold transition-colors active:scale-95 border", selectedFolder === "" ? "bg-primary text-primary-foreground border-primary" : "bg-chrome text-foreground border-transparent")}
              >
                {t("grocery.defaultFolder")}
              </button>
              {folders.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolder(f.id)}
                  className={clsx("px-4 py-2 rounded-xl text-sm font-bold transition-colors active:scale-95 border", selectedFolder === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-chrome text-foreground border-transparent")}
                >
                  {f.icon} {f.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">{t("addGrocery.itemLabel")}</label>
            <input
              autoFocus
              className="w-full bg-chrome text-foreground font-bold text-lg px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 placeholder-muted-foreground/50"
              placeholder={t("addGrocery.itemPlaceholder")}
              value={title}
              onChange={e => { setTitle(e.target.value); onTyping?.(); }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">{t("addGrocery.noteLabel")}</label>
            <textarea
              rows={2}
              className="w-full bg-chrome text-foreground text-base px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 placeholder-muted-foreground/50 resize-none"
              placeholder={t("addGrocery.notePlaceholder")}
              value={memo}
              onChange={e => setMemo(e.target.value)}
            />
          </div>
          <TypingIndicator names={typingUsers} />
          <div className="flex gap-3 pb-safe">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-chrome text-foreground/70 font-bold rounded-2xl active:scale-[0.98] transition-transform">{t("common.cancel")}</button>
            <button type="submit" disabled={!title.trim()} className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-2xl disabled:opacity-50 active:scale-[0.98] transition-transform">{t("common.add")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
