const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

const insertStr = `
const savedTheme = localStorage.getItem("theme") || "clean-blue";
document.documentElement.setAttribute("data-theme", savedTheme);
`;

if (!code.includes("data-theme")) {
  code = code.replace('import App from "./App";', 'import App from "./App";' + insertStr);
}

fs.writeFileSync('src/main.tsx', code);
