const fs = require('fs');
let settings = fs.readFileSync('src/SettingsPage.tsx', 'utf-8');
const pwaBanner = `          {prompt && (
            <SettingsGroup label="앱 설치">
              <SettingsRow
                label="홈 화면에 앱 설치하기"
                icon={<IconDownload size={18} stroke={2} />}
                onClick={promptToInstall}
              />
            </SettingsGroup>
          )}\n\n`;
settings = settings.replace('          <SettingsGroup label="그룹 관리">', pwaBanner + '          <SettingsGroup label="그룹 관리">');
fs.writeFileSync('src/SettingsPage.tsx', settings);
