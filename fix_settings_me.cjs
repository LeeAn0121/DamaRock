const fs = require('fs');
let code = fs.readFileSync('src/SettingsPage.tsx', 'utf-8');

// 1. Import useAppData
if (!code.includes('import { useAppData }')) {
  code = code.replace(
    'import { useInstallPrompt } from "./hooks/useInstallPrompt";',
    'import { useInstallPrompt } from "./hooks/useInstallPrompt";\nimport { useAppData } from "./hooks/useAppData";'
  );
}

// 2. Define `me` and call `useAppData` right inside the component
const insertStr = `
  const me = members.find(m => m.id === userId);
  const { updateLanguage, updateFamilyName } = useAppData();
`;
code = code.replace(
  '// Push Notifications Settings',
  insertStr + '\n  // Push Notifications Settings'
);

fs.writeFileSync('src/SettingsPage.tsx', code);
