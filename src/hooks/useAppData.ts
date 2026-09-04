import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { Category, Item, Member } from "../data";

export type Family = { id: string; name: string; inviteCode: string };
export type Invite = { id: string; invitedName: string; invitedEmail: string | null };

type Status = "loading" | "signed-out" | "needs-family" | "ready" | "error";

type MemberRow = {
  user_id: string;
  role: "어른" | "아이";
  profiles: { display_name: string; initial: string } | null;
};

type ItemRow = {
  id: string;
  title: string;
  category: Category;
  done: boolean;
  added_by: string;
  assignee: string | null;
  meta: string | null;
};

export function useAppData() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const onlineIdsRef = useRef<Set<string>>(new Set());

  const applyOnline = useCallback((rows: Member[]) => {
    const online = onlineIdsRef.current;
    return rows.map((m) => ({ ...m, online: online.has(m.id) }));
  }, []);

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

      const [{ data: familyRow, error: fErr }, { data: memberRows }, { data: itemRows }, { data: inviteRows }] =
        await Promise.all([
          supabase.from("families").select("id, name, invite_code").eq("id", familyId).single(),
          supabase
            .from("family_members")
            .select("user_id, role, profiles(display_name, initial)")
            .eq("family_id", familyId)
            .returns<MemberRow[]>(),
          supabase
            .from("items")
            .select("id, title, category, done, added_by, assignee, meta")
            .eq("family_id", familyId)
            .order("created_at", { ascending: false })
            .returns<ItemRow[]>(),
          supabase
            .from("family_invites")
            .select("id, invited_name, invited_email")
            .eq("family_id", familyId)
            .eq("status", "pending"),
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
        }))
      );
      setInvites(
        (inviteRows ?? []).map((r) => ({ id: r.id, invitedName: r.invited_name, invitedEmail: r.invited_email }))
      );
      setStatus("ready");
    },
    [applyOnline]
  );

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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
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
      loadFamilyData(session.user.id);
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
        () => loadFamilyData(userId)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_members", filter: `family_id=eq.${family.id}` },
        () => loadFamilyData(userId)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_invites", filter: `family_id=eq.${family.id}` },
        () => loadFamilyData(userId)
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
      await supabase.from("items").insert({
        family_id: family.id,
        title: input.title,
        category: input.category,
        added_by: userId,
        assignee: input.assignee ?? null,
        meta: input.meta ?? null,
      });
    },
    [family, userId]
  );

  const quickAdd = useCallback((title: string) => addItem({ title, category: "inbox" }), [addItem]);

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

  const cancelInvite = useCallback(async (id: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("family_invites").update({ status: "cancelled" }).eq("id", id);
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return {
    status,
    error,
    userId,
    family,
    members,
    items,
    invites,
    toggleDone,
    assignCategory,
    addItem,
    quickAdd,
    createFamily,
    joinFamily,
    cancelInvite,
    signOut,
  };
}
