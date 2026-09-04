import { useEffect, useState } from "react";
import { IconChevronLeft, IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import { supabase } from "./lib/supabaseClient";

type Announcement = {
  id: string;
  content: string;
  created_at: string;
};

export default function AnnouncementPage({
  familyId,
  userId,
  onBack,
}: {
  familyId: string;
  userId: string;
  onBack: () => void;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, [familyId]);

  const loadAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    
    const { data } = await supabase
      .from("announcements")
      .insert({
        family_id: familyId,
        author_id: userId,
        content: draft.trim(),
      })
      .select()
      .single();

    if (data) {
      setAnnouncements((prev) => [data, ...prev]);
      setDraft("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleEdit = async (id: string, oldContent: string) => {
    const newContent = window.prompt("수정할 소식을 입력하세요:", oldContent);
    if (!newContent || newContent.trim() === oldContent) return;

    await supabase.from("announcements").update({ content: newContent.trim() }).eq("id", id);
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, content: newContent.trim() } : a)));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md md:max-w-2xl lg:max-w-4xl flex-col">
        <header className="flex items-center justify-between border-b border-border/60 px-2 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="뒤로"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
            >
              <IconChevronLeft size={24} stroke={1.75} />
            </button>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight">우체통 소식 관리</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6">
          <form onSubmit={handleAdd} className="mb-8">
            <label className="mb-2 block text-sm font-bold text-muted-foreground">새로운 소식 등록</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="가족에게 알릴 새로운 소식을 적어보세요..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
              >
                <IconPlus size={20} stroke={2} />
              </button>
            </div>
          </form>

          <h2 className="mb-4 text-sm font-bold text-muted-foreground">등록된 소식 ({announcements.length})</h2>
          
          {loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl border border-border border-dashed p-8 text-center text-muted-foreground">
              <p className="text-sm font-medium">등록된 소식이 없습니다.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {announcements.map((a) => (
                <li key={a.id} className="flex flex-col rounded-xl bg-surface p-4 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-sm font-medium whitespace-pre-wrap flex-1 leading-relaxed text-foreground">
                      {a.content}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleEdit(a.id, a.content)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                        <IconEdit size={16} stroke={2} />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 text-muted-foreground hover:text-danger transition-colors">
                        <IconTrash size={16} stroke={2} />
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 mt-2">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
