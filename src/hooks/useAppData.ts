import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { Category, Item, Member, Comment } from "../data";

export type Family = { id: string; name: string; inviteCode: string };
export type Invite = { id: string; invitedName: string; invitedEmail: string | null };

type Status = "loading" | "signed-out" | "needs-family" | "ready" | "error";

const PENDING_JOIN_KEY = "damarock_pending_join";

type MemberRow = {
  user_id: string;
  role: "가족대표" | "구성원";
  profiles: { display_name: string; initial: string; avatar_url: string | null; language?: string } | null;
};

type ItemRow = {
  id: string;
  title: string;
  category: Category;
  done: boolean;
  added_by: string;
  assignee: string | null;
  meta: string | null;
  created_at: string;
  deleted_at: string | null;
};

export function useAppData() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const onlineIdsRef = useRef<Set<string>>(new Set());

  const [hasUnreadActivity, setHasUnreadActivity] = useState(false);
  const clearUnreadActivity = useCallback(() => setHasUnreadActivity(false), []);



  const applyOnline = useCallback((rows: Member[]) => {
    const online = onlineIdsRef.current;
    return rows.map((m) => ({ ...m, online: online.has(m.id) }));
  }, []);


  const updateLanguage = async (lang: string) => {
    if (!userId) return;
    const { error } = await supabase.from("profiles").update({ language: lang }).eq("id", userId);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, language: lang } : m));
    }
  };

  const loadFamilyData = useCallback(
    async (uid: string) => {
      const { data: membership, error: mErr } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (mErr) {
        setError(mErr.message);
        setStatus("error");
        return;
      }
      if (!membership) {
        setStatus("needs-family");
        return;
      }

      const familyId = membership.family_id as string;

      const [{ data: familyRow, error: fErr }, { data: memberRows }, { data: itemRows }, { data: inviteRows }, { data: commentRows }] =
        await Promise.all([
          supabase.from("families").select("id, name, invite_code").eq("id", familyId).single(),
          supabase
            .from("family_members")
            .select("user_id, role, profiles(display_name, initial, avatar_url, language)")
            .eq("family_id", familyId)
            .returns<MemberRow[]>(),
          supabase
            .from("items")
            .select("id, title, category, done, added_by, assignee, meta, created_at, deleted_at")
            .eq("family_id", familyId)
            .order("created_at", { ascending: false })
            .returns<ItemRow[]>(),
          supabase
            .from("family_invites")
            .select("id, invited_name, invited_email, created_at")
            .eq("family_id", familyId)
            .eq("status", "pending"),
          supabase
            .from("comments")
            .select("*")
            .eq("family_id", familyId)
            .order("created_at", { ascending: true })
            .returns<Comment[]>(),
        ]);

      if (fErr || !familyRow) {
        setError(fErr?.message ?? "가족 정보를 찾을 수 없어요");
        setStatus("error");
        return;
      }

      setFamily({ id: familyRow.id, name: familyRow.name, inviteCode: familyRow.invite_code });
      setMembers(
        applyOnline(
          (memberRows ?? []).map((r) => ({
            id: r.user_id,
            name: r.profiles?.display_name ?? "가족",
            initial: r.profiles?.initial ?? "가",
            avatar_url: r.profiles?.avatar_url?.replace(/^http:\/\//i, 'https://'),
            role: r.role,
          }))
        )
      );
      setItems(
        (itemRows ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          done: r.done,
          addedBy: r.added_by,
          assignee: r.assignee ?? undefined,
          meta: r.meta ?? undefined,
          created_at: r.created_at,
          deleted_at: r.deleted_at,
        }))
      );
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      setInvites(
        (inviteRows ?? [])
          .filter(r => r.created_at > oneDayAgo)
          .map((r) => ({ id: r.id, invitedName: r.invited_name, invitedEmail: r.invited_email }))
      );
      setComments(commentRows ?? []);
      setStatus("ready");
    },
    [applyOnline]
  );

  const refreshInviteCode = useCallback(
    async () => {
      if (!family) return;
      const { data, error: rpcError } = await supabase.rpc("refresh_invite_code", { p_family_id: family.id });
      if (rpcError) {
        console.error(rpcError);
        return;
      }
      if (userId) await loadFamilyData(userId);
    },
    [family, userId, loadFamilyData]
  );

  // Capture ?join=<code> from an invite link before it's lost — persisted across
  // the OAuth redirect so a not-yet-logged-in visitor still auto-joins after login.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("join");
    if (!code) return;
    sessionStorage.setItem(PENDING_JOIN_KEY, code);
    params.delete("join");
    const rest = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (rest ? `?${rest}` : ""));
  }, []);

  // Auth bootstrap
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        setStatus("signed-out");
        return;
      }
      setUserId(session.user.id);
      loadFamilyData(session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setStatus("signed-out");
        setUserId(null);
        setFamily(null);
        setMembers([]);
        setItems([]);
        setInvites([]);
        return;
      }
      setUserId(session.user.id);
      
      // Only reload data on initial sign-in or session start, not on silent token refreshes
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        loadFamilyData(session.user.id);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadFamilyData]);

  // Realtime: postgres changes + presence, scoped to the current family
  useEffect(() => {
    if (!family || !userId) return;

    const channel: RealtimeChannel = supabase.channel(`family:${family.id}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        onlineIdsRef.current = new Set(Object.keys(channel.presenceState()));
        setMembers((prev) => applyOnline(prev));
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `family_id=eq.${family.id}` },
        (payload) => {
          loadFamilyData(userId);
          
          const isSystem = (payload.new && payload.new.title === '__SYSTEM_FOLDERS__') || (payload.old && payload.old.title === '__SYSTEM_FOLDERS__');
          if (isSystem) return;

          const notify = localStorage.getItem("notifyItemChanges") !== "false";
          if (!notify) return;

          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
              Notification.requestPermission();
            }
            if (Notification.permission === "granted") {
              const eventType = payload.eventType;
              const itemData = payload.new || payload.old;
              const title = "담아락 가족 활동";
              let body = "";
              
              if (itemData) {
                const categoryStr = itemData.category === "todo" ? "할 일" : (itemData.category === "grocery" ? "장보기 항목" : "항목");
                const itemTitle = itemData.title;
                
                if (eventType === "INSERT" && itemData.added_by !== userId) {
                  body = `새로운 ${categoryStr} '${itemTitle}'(이)가 등록되었습니다.`;
                } else if (eventType === "UPDATE") {
                  body = `${categoryStr} '${itemTitle}'(이)가 수정/완료되었습니다.`;
                } else if (eventType === "DELETE") {
                  body = `${categoryStr} '${itemTitle}'(이)가 삭제되었습니다.`;
                }
                
                if (body) {
                  setHasUnreadActivity(true);
                  new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icon-192.png` });
                }
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_members", filter: `family_id=eq.${family.id}` },
        (payload) => {
          loadFamilyData(userId);
          if (payload.eventType === "INSERT" && payload.new.user_id !== userId) {
            setHasUnreadActivity(true);
            const notify = localStorage.getItem("notifyMemberJoin") !== "false";
            if (notify && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("담아락 소식", { body: "새로운 가족 구성원이 참여했습니다!", icon: `${import.meta.env.BASE_URL}icon-192.png` });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_invites", filter: `family_id=eq.${family.id}` },
        () => loadFamilyData(userId)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `family_id=eq.${family.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setComments((prev) => [...prev, payload.new as Comment]);
          } else if (payload.eventType === "UPDATE") {
            setComments((prev) => prev.map((c) => c.id === payload.new.id ? (payload.new as Comment) : c));
          } else if (payload.eventType === "DELETE") {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe(async (subStatus) => {
        if (subStatus === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [family, userId, loadFamilyData, applyOnline]);

  const toggleDone = useCallback(
    async (id: string) => {
      const current = items.find((i) => i.id === id);
      if (!current) return;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
      const { error: updateError } = await supabase.from("items").update({ done: !current.done }).eq("id", id);
      if (updateError && userId) loadFamilyData(userId);
    },
    [items, userId, loadFamilyData]
  );

  const assignCategory = useCallback(
    async (id: string, category: Category) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, category } : i)));
      const { error: updateError } = await supabase.from("items").update({ category }).eq("id", id);
      if (updateError && userId) loadFamilyData(userId);
    },
    [userId, loadFamilyData]
  );

  const addItem = useCallback(
    async (input: { title: string; category: Category; assignee?: string; meta?: string }) => {
      if (!family || !userId) return;
      const { error: insertError } = await supabase.from("items").insert({
        family_id: family.id,
        title: input.title,
        category: input.category,
        added_by: userId,
        assignee: input.assignee ?? null,
        meta: input.meta ?? null,
      });
      if (insertError) {
        console.error("Item add error:", insertError);
        window.alert(`아이템 추가 실패: ${insertError.message}\n상세: ${insertError.details}\n힌트: ${insertError.hint}`);
      }
    },
    [family, userId]
  );

  const quickAdd = useCallback((title: string) => addItem({ title, category: "inbox" }), [addItem]);

  const deleteItem = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, deleted_at: now } : i)));
      const { error: deleteError } = await supabase.from("items").update({ deleted_at: now }).eq("id", id);
      if (deleteError && userId) loadFamilyData(userId);
    },
    [userId, loadFamilyData]
  );

  const restoreItem = useCallback(
    async (id: string) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, deleted_at: null } : i)));
      const { error } = await supabase.from("items").update({ deleted_at: null }).eq("id", id);
      if (error && userId) loadFamilyData(userId);
    },
    [userId, loadFamilyData]
  );

  const hardDeleteItem = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error && userId) loadFamilyData(userId);
    },
    [userId, loadFamilyData]
  );

  const editItem = useCallback(
    async (id: string, title: string, meta?: string | null) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, title, ...(meta !== undefined ? { meta: meta || undefined } : {}) } : i)));
      const updatePayload: any = { title };
      if (meta !== undefined) updatePayload.meta = meta;
      const { error: updateError } = await supabase.from("items").update(updatePayload).eq("id", id);
      if (updateError && userId) loadFamilyData(userId);
    },
    [userId, loadFamilyData]
  );

  const moveItems = useCallback(
    async (ids: string[], targetCategory: Category) => {
      setItems((prev) => prev.map((i) => (ids.includes(i.id) ? { ...i, category: targetCategory } : i)));
      const { error } = await supabase.from("items").update({ category: targetCategory }).in("id", ids);
      if (error && userId) loadFamilyData(userId);
    },
    [userId, loadFamilyData]
  );

  const createFamily = useCallback(
    async (name: string) => {
      const { error: rpcError } = await supabase.rpc("create_family", { family_name: name });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setError(null);
      if (userId) await loadFamilyData(userId);
    },
    [userId, loadFamilyData]
  );

  const joinFamily = useCallback(
    async (code: string) => {
      const { error: rpcError } = await supabase.rpc("join_family_by_code", { code });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setError(null);
      if (userId) await loadFamilyData(userId);
    },
    [userId, loadFamilyData]
  );

  // Auto-join once we know the visitor has no family yet and an invite link was opened.
  useEffect(() => {
    if (status !== "needs-family") return;
    const pending = sessionStorage.getItem(PENDING_JOIN_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_JOIN_KEY);
    joinFamily(pending);
  }, [status, joinFamily]);

  const cancelInvite = useCallback(async (id: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("family_invites").update({ status: "cancelled" }).eq("id", id);
  }, []);

  const refreshData = useCallback(() => {
    if (userId) {
      loadFamilyData(userId);
    }
  }, [userId, loadFamilyData]);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return {
    status,
    error,
    userId,
    family,
    members,
    items,
    comments,
    invites,
    toggleDone,
    assignCategory,
    addItem,
    quickAdd,
    deleteItem,
    restoreItem,
    hardDeleteItem,
    editItem,
    moveItems,
    createFamily,
    joinFamily,
    cancelInvite,
    refreshData,
    signOut,
    hasUnreadActivity,
    clearUnreadActivity,
    refreshInviteCode,
  };
}
