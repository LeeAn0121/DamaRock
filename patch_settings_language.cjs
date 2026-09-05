const fs = require('fs');
let code = fs.readFileSync('src/SettingsPage.tsx', 'utf-8');

// 1. Get updateLanguage from useAppData
code = code.replace(
  'const { family, members, refreshInviteCode } = useAppData();',
  'const { family, members, refreshInviteCode, updateLanguage } = useAppData();'
);

// 2. Define `me` higher up
code = code.replace(
  '  const appVersion = `v${__APP_VERSION__}`;\n  const me = members.find((m) => m.id === userId);',
  '  const appVersion = `v${__APP_VERSION__}`;'
);
code = code.replace(
  'const { family, members, refreshInviteCode, updateLanguage } = useAppData();',
  'const { family, members, refreshInviteCode, updateLanguage } = useAppData();\n  const me = members.find((m) => m.id === userId);'
);

// 3. Initialize language with `me?.language`
code = code.replace(
  'const [language, setLanguage] = useState(() => localStorage.getItem("language") || "auto");',
  'const [language, setLanguage] = useState(() => me?.language || localStorage.getItem("language") || "auto");'
);

// 4. Create handleLanguageChange function
const handleLangFunc = `  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLanguage(val);
    updateLanguage(val);
  };`;
code = code.replace('  const [holiday, setHoliday]', handleLangFunc + '\n  const [holiday, setHoliday]');

// 5. Update the onChange handler
code = code.replace(
  'onChange={e => setLanguage(e.target.value)}',
  'onChange={handleLanguageChange}'
);

fs.writeFileSync('src/SettingsPage.tsx', code);
