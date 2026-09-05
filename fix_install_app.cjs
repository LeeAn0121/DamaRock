const fs = require('fs');

// 1. Fix SettingsPage.tsx
let settings = fs.readFileSync('src/SettingsPage.tsx', 'utf-8');
settings = settings.replace('const { prompt, promptToInstall } = useInstallPrompt();', 'const { isInstallable, promptInstall } = useInstallPrompt();');
settings = settings.replace('{prompt && (', '{isInstallable && (');
settings = settings.replace('onClick={promptToInstall}', 'onClick={promptInstall}');
fs.writeFileSync('src/SettingsPage.tsx', settings);

// 2. Remove from HomeList.tsx
let home = fs.readFileSync('src/HomeList.tsx', 'utf-8');
const blockToRemove = `        {isInstallable && (
          <div className="bg-primary/10 px-5 py-3 flex items-center justify-between border-b border-primary/20">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary">담아락 앱 설치하기</span>
              <span className="text-xs text-primary/80 font-medium mt-0.5">홈 화면에 추가하고 더 빠르게 사용하세요!</span>
            </div>
            <button
              onClick={promptInstall}
              className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              설치
            </button>
          </div>
        )}\n\n`;
home = home.replace(blockToRemove, '');

// Don't forget to also remove the hook call from HomeList.tsx
home = home.replace('const { isInstallable, promptInstall } = useInstallPrompt();', '');

fs.writeFileSync('src/HomeList.tsx', home);
