import { useState, useEffect } from "react";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import { useAppData } from "./hooks/useAppData";
import clsx from "clsx";
import { 
  IconChevronLeft, IconChevronRight, IconLogout, IconUsers, 
  IconPalette, IconBell, IconLanguage, IconCalendar, IconHandMove,
  IconTrash, IconUserEdit, IconMoon, IconSun, IconEdit
} from "@tabler/icons-react";
import { memberName, type Member } from "./data";
import { supabase } from "./lib/supabaseClient";

// A reusable switch component
function Switch({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        checked ? "bg-primary" : "bg-chrome-foreground/20"
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

// Reusable settings group component
function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 pl-2 text-sm font-bold text-muted-foreground">{label}</h2>
      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm border border-border/40">
        <ul className="divide-y divide-border/60">{children}</ul>
      </div>
    </section>
  );
}

// Reusable settings row component
function SettingsRow({
  icon,
  label,
  description,
  trailing,
  onClick,
  destructive
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const isButton = !!onClick;
  const Wrapper = isButton ? "button" : "div";
  return (
    <li className="flex min-h-[56px] items-center gap-4 px-4 py-2 relative">
      {isButton && (
        <Wrapper
          onClick={onClick}
          className="absolute inset-0 z-0 h-full w-full bg-transparent transition-colors hover:bg-chrome/40 active:bg-chrome/60"
        />
      )}
      {icon && (
        <div className={clsx("relative z-10 shrink-0", destructive ? "text-danger" : "text-primary/80")}>
          {icon}
        </div>
      )}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col py-1">
        <span className={clsx("truncate text-[15px] font-bold", destructive ? "text-danger" : "text-foreground")}>
          {label}
        </span>
        {description && <span className="text-xs text-muted-foreground mt-0.5">{description}</span>}
      </div>
      {trailing && <div className="relative z-10 shrink-0 ml-4">{trailing}</div>}
      {isButton && !trailing && (
        <div className="relative z-10 shrink-0 text-muted-foreground/50">
          <IconChevronRight size={20} stroke={2} />
        </div>
      )}
    </li>
  );
}

export default function SettingsPage({
  familyName,
  members,
  userId,
  onBack,
  onOpenInvite,
  onSignOut,
}: {
  familyName: string;
  members: Member[];
  userId: string | null;
  onBack: () => void;
  onOpenInvite: () => void;
  onSignOut: () => void;
}) {
  
  const me = members.find(m => m.id === userId);
  const { updateLanguage, updateFamilyName } = useAppData();

  // Push Notifications Settings
  const [notifyNewItem, setNotifyNewItem] = useState(() => localStorage.getItem("notifyNewItem") !== "false");
  const [notifyComments, setNotifyComments] = useState(() => localStorage.getItem("notifyComments") !== "false");
  const [notifyBriefing, setNotifyBriefing] = useState(() => localStorage.getItem("notifyBriefing") !== "false");
    const { isInstallable, promptInstall } = useInstallPrompt();
  const [briefingTime, setBriefingTime] = useState(() => localStorage.getItem("briefingTime") || "08:00");
  const [notifySummary, setNotifySummary] = useState(() => localStorage.getItem("notifySummary") !== "false");
  const [quietMode, setQuietMode] = useState(() => localStorage.getItem("quietMode") === "true");
  const [quietStart, setQuietStart] = useState(() => localStorage.getItem("quietStart") || "23:00");
  const [quietEnd, setQuietEnd] = useState(() => localStorage.getItem("quietEnd") || "07:00");

  // Localizations & Regional
  const [language, setLanguage] = useState(() => me?.language || localStorage.getItem("language") || "auto");

  const handleEditFamilyName = async () => {
    const newName = window.prompt("새로운 가족 이름을 입력하세요", familyName);
    if (newName && newName.trim() !== "" && newName !== familyName) {
      if (updateFamilyName) await updateFamilyName(newName.trim());
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLanguage(val);
    updateLanguage(val);
  };
  const [holiday, setHoliday] = useState(() => localStorage.getItem("holiday") || "auto");

  // Interaction
  const [swipeAction, setSwipeAction] = useState(() => localStorage.getItem("swipeAction") === "true");

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "clean-blue");

  useEffect(() => {
    localStorage.setItem("notifyNewItem", String(notifyNewItem));
    localStorage.setItem("notifyComments", String(notifyComments));
    localStorage.setItem("notifyBriefing", String(notifyBriefing));
    localStorage.setItem("briefingTime", briefingTime);
    localStorage.setItem("notifySummary", String(notifySummary));
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("quietMode", String(quietMode));
    localStorage.setItem("quietStart", quietStart);
    localStorage.setItem("quietEnd", quietEnd);
    localStorage.setItem("language", language);
    localStorage.setItem("holiday", holiday);
    localStorage.setItem("swipeAction", String(swipeAction));
    localStorage.setItem("theme", theme);
  }, [
    notifyNewItem, notifyComments, notifyBriefing, briefingTime, notifySummary,
    quietMode, quietStart, quietEnd, language, holiday, swipeAction, theme
  ]);

  const appVersion = `v${__APP_VERSION__}`;
  
  // Account login provider display (last login)
  const lastProvider = localStorage.getItem('lastLoginProvider');
  const providerDisplay = lastProvider === 'kakao' ? '카카오톡' : lastProvider === 'google' ? 'Google' : '이메일';

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md md:max-w-2xl lg:max-w-4xl flex-col">
        <header className="flex items-center gap-1 border-b border-border/60 px-2 py-3">
          <button
            type="button"
            aria-label="뒤로"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-chrome/60 active:bg-chrome"
          >
            <IconChevronLeft size={20} stroke={1.75} />
          </button>
          <h1 className="text-base font-bold text-foreground">설정</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-10 pt-4">
          
          {/* Profile Section */}
          <section className="flex flex-col gap-4 rounded-2xl bg-surface p-5 mb-8 border border-border/40 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-chrome text-2xl font-bold text-chrome-foreground shadow-sm overflow-hidden border-2 border-primary/10">
                {me?.avatar_url ? (
                  <img src={me.avatar_url} alt={me.name} className="h-full w-full object-cover" />
                ) : (
                  me?.initial ?? "나"
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-bold text-foreground flex items-center gap-2">
                  {memberName(members, userId ?? undefined)}
                  <button className="text-muted-foreground hover:text-primary transition-colors p-1" onClick={() => alert("표시 이름 변경 기능은 곧 제공될 예정입니다.")}><IconUserEdit size={16} stroke={2}/></button>
                </span>
                <span className="block text-sm font-medium text-muted-foreground">{me?.role ?? "가족 구성원"}</span>
              </span>
            </div>
            <div className="mt-2 rounded-xl bg-chrome/50 p-3 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">로그인 방식</span>
              <span className="font-bold flex items-center gap-1">
                {providerDisplay} {me && <span className="opacity-60 font-normal">({me.name})</span>}
              </span>
            </div>
          </section>

          {/* Group Management */}
          {isInstallable && (
            <SettingsGroup label="앱 설치">
              <SettingsRow
                label="홈 화면에 앱 설치하기"
                icon={<IconDownload size={18} stroke={2} />}
                onClick={promptInstall}
              />
            </SettingsGroup>
          )}

          <SettingsGroup label="그룹 관리">
            <SettingsRow 
              label="가족 이름" 
              onClick={handleEditFamilyName}
              trailing={<span className="text-sm font-medium text-primary">{familyName} <IconEdit className="inline" size={14}/></span>} 
            />
            <SettingsRow 
              label="함께한 시간" 
              description="우리가 함께 기록하기 시작한 날"
              trailing={<span className="text-sm font-bold text-muted-foreground text-right"><span className="text-primary">12일째</span> 함께 기록 중</span>} 
            />
            <SettingsRow
              label="그룹 멤버"
              description="총 3명 (관리자, 나, 구성원)"
              icon={<IconUsers size={18} stroke={2} />}
              onClick={onOpenInvite}
              trailing={
                <span className="flex -space-x-2">
                  {members.map((m) => (
                    <span
                      key={m.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-chrome text-[10px] font-bold text-chrome-foreground overflow-hidden shadow-sm"
                    >
                      {m.avatar_url ? <img src={m.avatar_url} alt={m.name} className="h-full w-full object-cover" /> : m.initial}
                    </span>
                  ))}
                </span>
              }
            />
            <SettingsRow
              label="다른 그룹 참여하기"
              description="여러 그룹을 오가며 사용할 수 있어요"
              icon={<IconUsers size={18} stroke={2} />}
              onClick={() => alert("다중 그룹 전환 기능은 서버 업데이트 후 지원됩니다.")}
            />
          </SettingsGroup>

          {/* Theme */}
          <SettingsGroup label="테마 및 화면">
            <SettingsRow
              label="디자인 테마"
              icon={<IconPalette size={18} stroke={2} />}
              trailing={
                <select 
                  className="bg-chrome text-sm font-bold py-1.5 px-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary text-foreground"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="clean-blue">클린 블루</option>
                  <option value="bonfire">모닥불</option>
                  <option value="ink">잉크</option>
                  <option value="dark">다크</option>
                  <option value="postit">포스트잇</option>
                  <option value="beige-navy">베이지네이비</option>
                </select>
              }
            />
          </SettingsGroup>

          {/* Notifications */}
          <SettingsGroup label="알림 설정">
            <SettingsRow
              label="새 항목 및 일정 추가"
              trailing={<Switch checked={notifyNewItem} onChange={setNotifyNewItem} />}
            />
            <SettingsRow
              label="새 댓글 알림"
              trailing={<Switch checked={notifyComments} onChange={setNotifyComments} />}
            />
            <SettingsRow
              label="모닝 브리핑"
              description="오늘의 일정과 장보기를 아침에 알려드려요"
              trailing={
                <div className="flex items-center gap-3">
                  {notifyBriefing && <input type="time" value={briefingTime} onChange={e => setBriefingTime(e.target.value)} className="bg-chrome text-sm p-1 rounded-md" />}
                  <Switch checked={notifyBriefing} onChange={setNotifyBriefing} />
                </div>
              }
            />
            <SettingsRow
              label="주간 요약"
              trailing={<Switch checked={notifySummary} onChange={setNotifySummary} />}
            />
            <div className="border-t border-border/40 mx-4" />
            <SettingsRow
              label="조용히 알림 (야간 모드)"
              description="설정한 시간에는 푸시 알림이 울리지 않아요"
              icon={<IconMoon size={18} stroke={2} />}
              trailing={<Switch checked={quietMode} onChange={setQuietMode} />}
            />
            {quietMode && (
              <li className="flex items-center justify-between px-10 py-3 bg-chrome/30 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><IconMoon size={16}/> 시작 <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} className="bg-chrome px-2 py-1 rounded-md ml-2"/></div>
                <div className="flex items-center gap-2 text-muted-foreground"><IconSun size={16}/> 종료 <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} className="bg-chrome px-2 py-1 rounded-md ml-2"/></div>
              </li>
            )}
          </SettingsGroup>

          {/* Regional Settings */}
          <SettingsGroup label="언어 및 지역">
            <SettingsRow
              label="언어 설정"
              icon={<IconLanguage size={18} stroke={2} />}
              trailing={
                <select value={language} onChange={handleLanguageChange} className="bg-chrome text-sm font-bold py-1.5 px-3 rounded-lg outline-none text-foreground">
                  <option value="auto">자동 (시스템)</option>
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              }
            />
            <SettingsRow
              label="달력 공휴일 기준"
              icon={<IconCalendar size={18} stroke={2} />}
              trailing={
                <select value={holiday} onChange={e => setHoliday(e.target.value)} className="bg-chrome text-sm font-bold py-1.5 px-3 rounded-lg outline-none text-foreground">
                  <option value="auto">자동 (시스템)</option>
                  <option value="KR">한국 🇰🇷</option>
                  <option value="US">미국 🇺🇸</option>
                  <option value="JP">일본 🇯🇵</option>
                  <option value="CN">중국 🇨🇳</option>
                </select>
              }
            />
          </SettingsGroup>

          {/* Interactions */}
          <SettingsGroup label="추가 설정">
            <SettingsRow
              label="스와이프로 삭제/완료"
              description="탭 이동 대신 항목을 밀어서 액션을 띄웁니다."
              icon={<IconHandMove size={18} stroke={2} />}
              trailing={<Switch checked={swipeAction} onChange={setSwipeAction} />}
            />
          </SettingsGroup>

          {/* Danger Zone */}
          <SettingsGroup label="계정 관리">
            <SettingsRow
              label="로그아웃"
              icon={<IconLogout size={18} stroke={2} />}
              onClick={onSignOut}
            />
            <SettingsRow
              label="계정 삭제"
              icon={<IconTrash size={18} stroke={2} />}
              destructive
              onClick={() => {
                if(window.confirm("정말 계정을 삭제하시겠습니까? 되돌릴 수 없습니다.")) {
                  alert("계정 삭제 처리는 서버 연동 후 지원됩니다.");
                }
              }}
            />
          </SettingsGroup>

          <div className="mt-8 flex justify-center pb-8">
            <span className="text-sm font-medium text-muted-foreground/60">담아락 {appVersion}</span>
          </div>
        </main>
      </div>
    </div>
  );
}
