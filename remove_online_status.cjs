const fs = require('fs');

// 1. HomeList.tsx
let home = fs.readFileSync('src/HomeList.tsx', 'utf-8');
// It looks like:
// {m.online && (
//   <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface bg-green-500" />
// )}
const onlineRegex = /\{m\.online && \([\s\S]*?\)\}/g;
home = home.replace(onlineRegex, '');
fs.writeFileSync('src/HomeList.tsx', home);

// 2. FamilyInvite.tsx
let invite = fs.readFileSync('src/FamilyInvite.tsx', 'utf-8');
invite = invite.replace(onlineRegex, '');
fs.writeFileSync('src/FamilyInvite.tsx', invite);

