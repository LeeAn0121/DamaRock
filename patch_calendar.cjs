const fs = require('fs');
let code = fs.readFileSync('src/CalendarView.tsx', 'utf-8');
code = code.replace(
  'const date = (item.meta const date = new Date(item.created_at);const date = new Date(item.created_at); item.meta.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) ? new Date(item.meta) : new Date(item.created_at);',
  'const date = (item.meta && item.meta.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) ? new Date(item.meta) : new Date(item.created_at);'
);
fs.writeFileSync('src/CalendarView.tsx', code);
