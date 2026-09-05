const fs = require('fs');
let home = fs.readFileSync('src/HomeList.tsx', 'utf-8');
const installBannerRegex = /\{prompt && \([\s\S]*?\}\)/;
home = home.replace(installBannerRegex, '');
home = home.replace('const { prompt, promptToInstall } = useInstallPrompt();', '');
home = home.replace('import { useInstallPrompt } from "./hooks/useInstallPrompt";', '');
fs.writeFileSync('src/HomeList.tsx', home);

let settings = fs.readFileSync('src/SettingsPage.tsx', 'utf-8');
settings = settings.replace('import { IconArrowLeft', 'import { IconArrowLeft, IconDownload');
settings = settings.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport { useInstallPrompt } from "./hooks/useInstallPrompt";');

const settingsBanner = `
          {/* PWA Install */}
          {prompt && (
            <SettingsGroup label="앱 설치">
              <SettingsRow
                label="홈 화면에 앱 설치하기"
                icon={<IconDownload size={18} stroke={2} />}
                onClick={promptToInstall}
              />
            </SettingsGroup>
          )}
`;
const insertionPoint = '{/* Settings Groups */}';
settings = settings.replace(insertionPoint, insertionPoint + settingsBanner);

const promptHook = '  const { prompt, promptToInstall } = useInstallPrompt();\n';
settings = settings.replace('const [briefingTime, setBriefingTime] = useState', promptHook + '  const [briefingTime, setBriefingTime] = useState');

fs.writeFileSync('src/SettingsPage.tsx', settings);
