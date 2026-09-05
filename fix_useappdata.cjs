const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAppData.ts', 'utf-8');

const refreshCodeStr = `  const refreshInviteCode = useCallback(
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
  );`;

code = code.replace(refreshCodeStr, '');
code = code.replace('const clearUnreadActivity = useCallback(() => setHasUnreadActivity(false), []);\n\n', 'const clearUnreadActivity = useCallback(() => setHasUnreadActivity(false), []);\n');

// Insert it after loadFamilyData
const insertAfter = '    [applyOnline]\n  );';
code = code.replace(insertAfter, insertAfter + '\n\n' + refreshCodeStr);

fs.writeFileSync('src/hooks/useAppData.ts', code);
