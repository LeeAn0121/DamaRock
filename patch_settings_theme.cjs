const fs = require('fs');
let code = fs.readFileSync('src/SettingsPage.tsx', 'utf-8');

// Inside useEffect where localStorage is saved
const searchStr = `    localStorage.setItem("notifySummary", String(notifySummary));`;
const insertStr = `    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);`;

if (!code.includes(insertStr)) {
  code = code.replace(searchStr, searchStr + '\n' + insertStr);
}

fs.writeFileSync('src/SettingsPage.tsx', code);
