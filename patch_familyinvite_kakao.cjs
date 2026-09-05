const fs = require('fs');
let code = fs.readFileSync('src/FamilyInvite.tsx', 'utf-8');

const kakaoLogic = `
                  if (window.Kakao && window.Kakao.isInitialized()) {
                    window.Kakao.Share.sendDefault({
                      objectType: 'text',
                      text: text,
                      link: {
                        mobileWebUrl: window.location.href,
                        webUrl: window.location.href,
                      },
                    });
                  } else {
                    alert("카카오톡 공유가 초기화되지 않았습니다. 관리자에게 문의하세요.");
                  }
`;

code = code.replace(
  'if(navigator.share) navigator.share({ text });\n                  else copyCode();',
  kakaoLogic
);

fs.writeFileSync('src/FamilyInvite.tsx', code);
