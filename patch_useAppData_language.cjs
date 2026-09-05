const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAppData.ts', 'utf-8');

// Update MemberRow type
code = code.replace(
  'profiles: { display_name: string; initial: string; avatar_url: string | null } | null;',
  'profiles: { display_name: string; initial: string; avatar_url: string | null; language?: string } | null;'
);

// Update Context interface
code = code.replace(
  'cancelInvite: (id: string) => void;',
  'cancelInvite: (id: string) => void;\n  updateLanguage: (lang: string) => void;'
);

// Update select query
code = code.replace(
  'select("user_id, role, profiles(display_name, initial, avatar_url)")',
  'select("user_id, role, profiles(display_name, initial, avatar_url, language)")'
);

// Update member mapping
code = code.replace(
  'avatar_url: row.profiles?.avatar_url || null,',
  'avatar_url: row.profiles?.avatar_url || null,\n            language: row.profiles?.language || "auto",'
);

// Add updateLanguage function
const updateLanguageFunc = `
  const updateLanguage = async (lang: string) => {
    if (!userId) return;
    const { error } = await supabase.from("profiles").update({ language: lang }).eq("id", userId);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, language: lang } : m));
    }
  };

  const loadFamilyData`;
code = code.replace('  const loadFamilyData', updateLanguageFunc);

// Expose updateLanguage in context provider
code = code.replace(
  'cancelInvite, refreshInviteCode',
  'cancelInvite, refreshInviteCode, updateLanguage'
);

fs.writeFileSync('src/hooks/useAppData.ts', code);
