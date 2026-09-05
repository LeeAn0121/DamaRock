const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAppData.ts', 'utf-8');

// Update Context interface
code = code.replace(
  'updateLanguage: (lang: string) => void;',
  'updateLanguage: (lang: string) => void;\n  updateFamilyName: (name: string) => Promise<void>;'
);

// Add updateFamilyName function
const func = `
  const updateFamilyName = async (name: string) => {
    if (!family) return;
    const { error } = await supabase.from("families").update({ name }).eq("id", family.id);
    if (!error) {
      setFamily(prev => prev ? { ...prev, name } : null);
    }
  };

  const loadFamilyData`;
code = code.replace('  const loadFamilyData', func);

// Expose updateFamilyName in context provider
code = code.replace(
  'cancelInvite, refreshInviteCode, updateLanguage',
  'cancelInvite, refreshInviteCode, updateLanguage, updateFamilyName'
);

fs.writeFileSync('src/hooks/useAppData.ts', code);
