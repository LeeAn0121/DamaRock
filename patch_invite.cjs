const fs = require('fs');

// Patch App.tsx
let useAppCode = fs.readFileSync('src/hooks/useAppData.ts', 'utf-8');

const refreshFunc = `
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
`;

useAppCode = useAppCode.replace(
  'const clearUnreadActivity = useCallback(() => setHasUnreadActivity(false), []);',
  'const clearUnreadActivity = useCallback(() => setHasUnreadActivity(false), []);\n' + refreshFunc
);

useAppCode = useAppCode.replace(
  'clearUnreadActivity,',
  'clearUnreadActivity,\n    refreshInviteCode,'
);

fs.writeFileSync('src/hooks/useAppData.ts', useAppCode);

// Patch App.tsx Props
let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
appCode = appCode.replace(
  '<FamilyInvite',
  '<FamilyInvite\n        onRefreshCode={data.refreshInviteCode}'
);
fs.writeFileSync('src/App.tsx', appCode);

// Patch FamilyInvite.tsx Props
let inviteCode = fs.readFileSync('src/FamilyInvite.tsx', 'utf-8');
inviteCode = inviteCode.replace(
  'onBack: () => void;',
  'onBack: () => void;\n  onRefreshCode: () => void;'
);
inviteCode = inviteCode.replace(
  'onBack,\n}: {',
  'onBack,\n  onRefreshCode,\n}: {'
);

const oldCodeUI = `
            <p className="text-sm font-medium text-muted-foreground">코드로 알려주기 <span className="text-xs text-danger/80">(자동 1일 후 만료)</span></p>
            <p className="mt-3 text-5xl font-extrabold tracking-[0.1em] text-primary">{code}</p>
`;
const newCodeUI = `
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              코드로 알려주기 <span className="text-xs text-danger/80">(자동 1일 후 만료)</span>
            </div>
            <p className="mt-3 text-5xl font-extrabold tracking-[0.1em] text-primary">{code}</p>
            <button onClick={() => onRefreshCode()} className="mt-2 mb-4 text-xs font-bold text-muted-foreground underline underline-offset-2 active:text-primary">
              새 코드 발급받기
            </button>
`;
inviteCode = inviteCode.replace(oldCodeUI.trim(), newCodeUI.trim());
fs.writeFileSync('src/FamilyInvite.tsx', inviteCode);
