const fs = require('fs');
let code = fs.readFileSync('src/SettingsPage.tsx', 'utf-8');

// Get updateFamilyName from context
code = code.replace(
  'const { family, members, refreshInviteCode, updateLanguage } = useAppData();',
  'const { family, members, refreshInviteCode, updateLanguage, updateFamilyName } = useAppData();'
);

// Add handleEditFamilyName
const func = `
  const handleEditFamilyName = async () => {
    const newName = window.prompt("새로운 가족 이름을 입력하세요", familyName);
    if (newName && newName.trim() !== "" && newName !== familyName) {
      if (updateFamilyName) await updateFamilyName(newName.trim());
    }
  };
`;
code = code.replace('  const handleLanguageChange', func + '\n  const handleLanguageChange');

// Update onClick
code = code.replace(
  'onClick={() => alert("가족 이름 수정 기능은 곧 제공될 예정입니다.")}',
  'onClick={handleEditFamilyName}'
);

fs.writeFileSync('src/SettingsPage.tsx', code);
