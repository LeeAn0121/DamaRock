const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAppData.ts', 'utf-8');

// Update item parsing mapping
code = code.replace(
  'addedBy: row.added_by, assignee: row.assignee, meta: row.meta, created_at: row.created_at, updated_at: row.updated_at',
  'addedBy: row.added_by, assignee: row.assignee, meta: row.meta, created_at: row.created_at, updated_at: row.updated_at, deleted_at: row.deleted_at'
);

// Add soft delete logic to deleteItem
const oldDelete = `
  const deleteItem = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      const { error: deleteError } = await supabase.from("items").delete().eq("id", id);
      if (deleteError && userId) loadFamilyData(userId);
    },
    [userId, loadFamilyData]
  );
`;

const newDelete = `
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
`;

code = code.replace(oldDelete.trim(), newDelete.trim());

// Add restoreItem and hardDeleteItem to exports
code = code.replace(
  'deleteItem,',
  'deleteItem,\n    restoreItem,\n    hardDeleteItem,'
);

// Make sure items subscription handles deleted_at update
code = code.replace(
  'done: row.done, addedBy: row.added_by, assignee: row.assignee, meta: row.meta',
  'done: row.done, addedBy: row.added_by, assignee: row.assignee, meta: row.meta, deleted_at: row.deleted_at'
);

fs.writeFileSync('src/hooks/useAppData.ts', code);
