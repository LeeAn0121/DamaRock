import { useEffect, useState, useRef } from "react";
import { IconX, IconSend } from "@tabler/icons-react";
import { supabase } from "./lib/supabaseClient";
import type { Item, Member } from "./data";
import { memberName } from "./data";
import clsx from "clsx";

type Comment = {
  id: string;
  item_id: string;
  family_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export default function ItemDetailSheet({
  item,
  open,
  members,
  familyId,
  userId,
  onClose,
}: {
  item: Item | null;
  open: boolean;
  members: Member[];
  familyId: string;
  userId: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !item) return;

    // Load initial comments
    const loadComments = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("item_id", item.id)
        .order("created_at", { ascending: true });
      if (data) setComments(data);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    loadComments();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`comments-${item.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `item_id=eq.${item.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setComments((prev) => [...prev, payload.new as Comment]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          } else if (payload.eventType === "DELETE") {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !item) return;

    const content = draft.trim();
    setDraft(""); // optimistic clear

    await supabase.from("comments").insert({
      item_id: item.id,
      family_id: familyId,
      author_id: userId,
      content,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-background shadow-2xl transition-transform duration-300 ease-out sm:mx-auto sm:max-w-md",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex h-1.5 w-full items-center justify-center pt-3 pb-4">
          <div className="h-1.5 w-10 rounded-full bg-border/60" />
        </div>
        
        <div className="flex items-center justify-between px-6 pb-2 border-b border-border/40">
          <h2 className="text-lg font-extrabold text-foreground truncate flex-1">
            {item?.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome shrink-0"
          >
            <IconX size={18} stroke={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground mt-4">댓글을 불러오는 중...</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground mt-4">첫 댓글을 남겨보세요!</p>
          ) : (
            comments.map((comment) => {
              const isMe = comment.author_id === userId;
              return (
                <div key={comment.id} className={clsx("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                  <span className="text-[10px] text-muted-foreground mb-1 ml-1">
                    {memberName(members, comment.author_id)}
                  </span>
                  <div className={clsx("px-4 py-2 rounded-2xl text-sm", isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-surface text-foreground rounded-tl-sm")}>
                    {comment.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border/40 p-4 pb-safe flex gap-2">
          <input
            type="text"
            placeholder="댓글 입력..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 rounded-full bg-surface px-4 py-2 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            <IconSend size={18} stroke={2} />
          </button>
        </form>
      </div>
    </>
  );
}
