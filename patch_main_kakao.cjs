const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

const kakaoInit = `
// Initialize Kakao SDK (Replace with real JavaScript Key)
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || "00000000000000000000000000000000"; // Dummy key for now
if (window.Kakao && !window.Kakao.isInitialized()) {
  try {
    window.Kakao.init(KAKAO_JS_KEY);
  } catch(e) {
    console.error("Kakao init failed", e);
  }
}
`;

if (!code.includes('window.Kakao')) {
  code = code.replace(
    'createRoot(document.getElementById("root")!).render(',
    kakaoInit + '\ncreateRoot(document.getElementById("root")!).render('
  );
  fs.writeFileSync('src/main.tsx', code);
}
