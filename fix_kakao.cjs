const fs = require('fs');

// 1. Fix index.html
let html = fs.readFileSync('index.html', 'utf-8');
html = html.replace(
  'integrity="sha384-TiCmbV6xjo0Q+ouGj0gNd9u928O01N7T0c4w7KME3/Z845r5u7R0bB2N0/vPj5A4" crossorigin="anonymous"',
  ''
);
fs.writeFileSync('index.html', html);

// 2. Fix main.tsx to use the user's key directly if .env is missing
let main = fs.readFileSync('src/main.tsx', 'utf-8');
main = main.replace(
  'const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || "00000000000000000000000000000000";',
  'const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || "e4352e1b92ec838dccb0263212cbd915";'
);
fs.writeFileSync('src/main.tsx', main);

