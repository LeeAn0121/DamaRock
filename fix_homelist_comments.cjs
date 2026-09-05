const fs = require('fs');
let code = fs.readFileSync('src/HomeList.tsx', 'utf-8');

// Add comments to props interface
code = code.replace(
  '  userId: string | null;',
  '  userId: string | null;\n  comments?: import("./data").Comment[];'
);

// Destructure comments from props or change `comments={comments}` to `comments={props.comments}`
code = code.replace(/comments=\{comments\}/g, 'comments={props.comments}');

fs.writeFileSync('src/HomeList.tsx', code);
