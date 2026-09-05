const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf-8');

if (!code.includes('kakao.min.js')) {
  code = code.replace(
    '</head>',
    '  <!-- Kakao SDK -->\n    <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" integrity="sha384-TiCmbV6xjo0Q+ouGj0gNd9u928O01N7T0c4w7KME3/Z845r5u7R0bB2N0/vPj5A4" crossorigin="anonymous"></script>\n  </head>'
  );
  fs.writeFileSync('index.html', code);
}
