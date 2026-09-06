import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { useI18n } from "../lib/i18n";
import type { Category, Item, Member, Comment } from "../data";

export type Family = { id: string; name: string; inviteCode: string; createdAt: string };
export type Invite = { id: string; invitedName: string; invitedEmail: string | null };

type Status = "loading" | "signed-out" | "needs-family" | "ready" | "error";

const PENDING_JOIN_KEY = "damarock_pending_join";
const ACTIVE_FAMILY_KEY = "damarock_active_family";
const SNAPSHOT_KEY = "damarock_snapshot";

type Snapshot = {
  family: Family;
  members: Member[];
  items: Item[];
  comments: Comment[];
  invites: Invite[];
};

// Lets the app open straight to the last-known list instead of a blank
// loading screen when there's no connection yet (or ever) to reach
// Supabase — a grocery app is most useful exactly when you're standing in
// a store with bad signal.
function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}

function saveSnapshot(snapshot: Snapshot) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // storage full/unavailable — the cache is a nice-to-have, not critical
  }
}

function isQuietHours(): boolean {
  if (localStorage.getItem("quietMode") !== "true") return false;
  const [sh, sm] = (localStorage.getItem("quietStart") || "23:00").split(":").map(Number);
  const [eh, em] = (localStorage.getItem("quietEnd") || "07:00").split(":").map(Number);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  if (startMinutes === endMinutes) return false;
  return startMinutes < endMinutes
    ? nowMinutes >= startMinutes && nowMinutes < endMinutes
    : nowMinutes >= startMinutes || nowMinutes < endMinutes; // wraps past midnight
}

function notifyIfAllowed(settingKey: string, title: string, body: string) {
  if (localStorage.getItem(settingKey) === "false") return;
  if (isQuietHours()) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
    return;
  }
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icon-192.png` });
  }
}

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
  const { t } = useI18n();
  const [snapshot] = useState(() => loadSnapshot());
  const [status, setStatus] = useState<Status>(snapshot ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(snapshot?.family ?? null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<Member[]>(snapshot?.members ?? []);
  const [items, setItems] = useState<Item[]>(snapshot?.items ?? []);
  const [comments, setComments] = useState<Comment[]>(snapshot?.comments ?? []);
  const [invites, setInvites] = useState<Invite[]>(snapshot?.invites ?? []);
  const onlineIdsRef = useRef<Set<string>>(new Set());
  const familyChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutsRef = useRef<Record<string, number>>({});
  // context -> userId -> display name. "context" is a free-form string the
  // caller picks (e.g. `comment:${itemId}`, "newItem") so unrelated typing
  // indicators never bleed into each other.
  const [typingByContext, setTypingByContext] = useState<Record<string, Record<string, string>>>({});

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


  const updateFamilyName = async (name: string) => {
    if (!family) return;
    const { error } = await supabase.from("families").update({ name }).eq("id", family.id);
    if (!error) {
      setFamily(prev => prev ? { ...prev, name } : null);
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!userId) return;
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", userId);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, name } : m));
    }
  };

  // Mirrors the localStorage-backed toggles in SettingsPage up to the
  // server: an in-tab notification can check localStorage directly, but a
  // scheduled morning-briefing/weekly-summary job runs with no browser tab
  // (and no localStorage) to read from, so it needs this instead.
  const syncNotificationSettings = useCallback(
    async (partial: {
      notifyNewItem?: boolean;
      notifyComments?: boolean;
      notifyBriefing?: boolean;
      briefingTime?: string;
      notifySummary?: boolean;
      quietMode?: boolean;
      quietStart?: string;
      quietEnd?: string;
    }) => {
      if (!userId) return;
      const row: Record<string, string | boolean> = { user_id: userId };
      if (partial.notifyNewItem !== undefined) row.notify_new_item = partial.notifyNewItem;
      if (partial.notifyComments !== undefined) row.notify_comments = partial.notifyComments;
      if (partial.notifyBriefing !== undefined) row.notify_briefing = partial.notifyBriefing;
      if (partial.briefingTime !== undefined) row.briefing_time = partial.briefingTime;
      if (partial.notifySummary !== undefined) row.notify_summary = partial.notifySummary;
      if (partial.quietMode !== undefined) row.quiet_mode = partial.quietMode;
      if (partial.quietStart !== undefined) row.quiet_start = partial.quietStart;
      if (partial.quietEnd !== undefined) row.quiet_end = partial.quietEnd;
      await supabase.from("notification_settings").upsert(row, { onConflict: "user_id" });
    },
    [userId]
  );

  const loadFamilyData = useCallback(
    async (uid: string, preferredFamilyId?: string) => {
      // A network failure (offline, DNS, etc.) with cached data already on
      // screen should just leave that cached data up rather than replacing
      // a usable stale list with an error screen — the realtime
      // reconnect/next successful refresh will bring it current again.
      const failSoft = (message: string) => {
        if (family) {
          console.error("loadFamilyData failed, keeping cached data:", message);
          return;
        }
        setError(message);
        setStatus("error");
      };

      try {
      const { data: memberships, error: mErr } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", uid)
        .order("joined_at", { ascending: true });

      if (mErr) {
        failSoft(mErr.message);
        return;
      }
      if (!memberships || memberships.length === 0) {
        setStatus("needs-family");
        return;
      }

      const familyIds = memberships.map((m) => m.family_id as string);
      const stored = preferredFamilyId ?? localStorage.getItem(ACTIVE_FAMILY_KEY) ?? undefined;
      const familyId = stored && familyIds.includes(stored) ? stored : familyIds[0];
      localStorage.setItem(ACTIVE_FAMILY_KEY, familyId);

      const { data: familyRows } = await supabase
        .from("families")
        .select("id, name, invite_code, created_at")
        .in("id", familyIds);
      setFamilies((familyRows ?? []).map((f) => ({ id: f.id, name: f.name, inviteCode: f.invite_code, createdAt: f.created_at })));

      const [{ data: familyRow, error: fErr }, { data: memberRows }, { data: itemRows }, { data: inviteRows }, { data: commentRows }] =
        await Promise.all([
          supabase.from("families").select("id, name, invite_code, created_at").eq("id", familyId).single(),
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
        failSoft(fErr?.message ?? t("errors.familyNotFound"));
        return;
      }

      const resolvedFamily: Family = { id: familyRow.id, name: familyRow.name, inviteCode: familyRow.invite_code, createdAt: familyRow.created_at };
      const resolvedMembers = applyOnline(
        (memberRows ?? []).map((r) => ({
          id: r.user_id,
          name: r.profiles?.display_name ?? "가족",
          initial: r.profiles?.initial ?? "가",
          avatar_url: r.profiles?.avatar_url?.replace(/^http:\/\//i, 'https://'),
          role: r.role,
        }))
      );
      const resolvedItems: Item[] = (itemRows ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        done: r.done,
        addedBy: r.added_by,
        assignee: r.assignee ?? undefined,
        meta: r.meta ?? undefined,
        created_at: r.created_at,
        deleted_at: r.deleted_at,
      }));
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const resolvedInvites: Invite[] = (inviteRows ?? [])
        .filter(r => r.created_at > oneDayAgo)
        .map((r) => ({ id: r.id, invitedName: r.invited_name, invitedEmail: r.invited_email }));
      const resolvedComments = commentRows ?? [];

      setFamily(resolvedFamily);
      setMembers(resolvedMembers);
      setItems(resolvedItems);
      setInvites(resolvedInvites);
      setComments(resolvedComments);
      setStatus("ready");
      saveSnapshot({ family: resolvedFamily, members: resolvedMembers, items: resolvedItems, comments: resolvedComments, invites: resolvedInvites });
      } catch (err) {
        failSoft(err instanceof Error ? err.message : String(err));
      }
    },
    [applyOnline, t, family]
  );

  const switchFamily = useCallback(
    (id: string) => {
      if (!userId || id === family?.id) return;
      localStorage.setItem(ACTIVE_FAMILY_KEY, id);
      loadFamilyData(userId, id);
    },
    [userId, family?.id, loadFamilyData]
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
    }).catch((err) => {
      if (!active) return;
      console.error("getSession failed:", err);
      // If a cached snapshot already put us in "ready", leave that stale-
      // but-usable view up instead of bouncing to an error screen.
      setStatus((prev) => (prev === "loading" ? "error" : prev));
      setError((prev) => prev ?? t("errors.networkError"));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setStatus("signed-out");
        setUserId(null);
        setFamily(null);
        setFamilies([]);
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
    familyChannelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { context, userId: typerId, name } = payload as { context: string; userId: string; name: string };
        if (typerId === userId) return; // ignore our own echo
        setTypingByContext((prev) => ({
          ...prev,
          [context]: { ...prev[context], [typerId]: name },
        }));
        const key = `${context}:${typerId}`;
        if (typingTimeoutsRef.current[key]) clearTimeout(typingTimeoutsRef.current[key]);
        typingTimeoutsRef.current[key] = window.setTimeout(() => {
          setTypingByContext((prev) => {
            const contextMap = { ...prev[context] };
            delete contextMap[typerId];
            return { ...prev, [context]: contextMap };
          });
        }, 3000);
      })
      .on("presence", { event: "sync" }, () => {
        onlineIdsRef.current = new Set(Object.keys(channel.presenceState()));
        setMembers((prev) => applyOnline(prev));
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `family_id=eq.${family.id}` },
        (payload) => {
          loadFamilyData(userId);

          const newRow = payload.new as Partial<ItemRow> | null;
          const oldRow = payload.old as Partial<ItemRow> | null;
          const isSystem = newRow?.title === '__SYSTEM_FOLDERS__' || oldRow?.title === '__SYSTEM_FOLDERS__';
          if (isSystem) return;

          const eventType = payload.eventType;
          const itemData = newRow || oldRow;
          if (!itemData) return;

          const categoryStr = itemData.category === "todo" ? t("common.todo") : (itemData.category === "grocery" ? t("notif.categoryGroceryItem") : t("notif.categoryItem"));
          const itemTitle = itemData.title ?? "";
          let body = "";

          if (eventType === "INSERT" && itemData.added_by !== userId) {
            body = t("notif.itemInserted", { category: categoryStr, title: itemTitle });
          } else if (eventType === "UPDATE") {
            body = t("notif.itemUpdated", { category: categoryStr, title: itemTitle });
          } else if (eventType === "DELETE") {
            body = t("notif.itemDeleted", { category: categoryStr, title: itemTitle });
          }

          if (body) {
            setHasUnreadActivity(true);
            notifyIfAllowed("notifyNewItem", t("notif.activityTitle"), body);
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
            notifyIfAllowed("notifyNewItem", t("notif.newsTitle"), t("notif.memberJoined"));
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
            const newComment = payload.new as Comment;
            setComments((prev) => [...prev, newComment]);
            if (newComment.author_id !== userId) {
              setHasUnreadActivity(true);
              notifyIfAllowed("notifyComments", t("notif.activityTitle"), t("notif.newComment"));
            }
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
      familyChannelRef.current = null;
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
      supabase.removeChannel(channel);
    };
  }, [family, userId, loadFamilyData, applyOnline, t]);

  const lastTypingSentRef = useRef<Record<string, number>>({});
  const notifyTyping = useCallback(
    (context: string) => {
      if (!userId || !familyChannelRef.current) return;
      const now = Date.now();
      if (now - (lastTypingSentRef.current[context] ?? 0) < 1500) return; // throttle
      lastTypingSentRef.current[context] = now;
      const name = members.find((m) => m.id === userId)?.name ?? "";
      familyChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { context, userId, name },
      });
    },
    [userId, members]
  );

  const toggleDone = useCallback(
    async (id: string) => {
      const current = items.find((i) => i.id === id);
      if (!current) return;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
      try {
        const { error: updateError } = await supabase.from("items").update({ done: !current.done }).eq("id", id);
        if (updateError && userId) loadFamilyData(userId);
      } catch (err) {
        console.error("Toggle done failed:", err);
        if (userId) loadFamilyData(userId); // revert the optimistic flip if the write never landed
      }
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
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        window.alert(t("errors.offlineActionBlocked"));
        return;
      }
      try {
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
          window.alert(`${t("errors.addItemFailedTitle")}: ${insertError.message}\n${t("errors.detail")}: ${insertError.details}\n${t("errors.hint")}: ${insertError.hint}`);
        }
      } catch (err) {
        console.error("Item add failed:", err);
        window.alert(navigator.onLine ? String(err) : t("errors.offlineActionBlocked"));
      }
    },
    [family, userId, t]
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
      const { data: newFamily, error: rpcError } = await supabase.rpc("create_family", { family_name: name });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setError(null);
      if (userId) await loadFamilyData(userId, newFamily?.id);
    },
    [userId, loadFamilyData]
  );

  const joinFamily = useCallback(
    async (code: string) => {
      const { data: joinedFamily, error: rpcError } = await supabase.rpc("join_family_by_code", { code });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setError(null);
      if (userId) await loadFamilyData(userId, joinedFamily?.id);
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
    families,
    switchFamily,
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
    updateLanguage,
    updateFamilyName,
    updateDisplayName,
    syncNotificationSettings,
    typingByContext,
    notifyTyping,
  };
}
