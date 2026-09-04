import { useState } from "react";
import { IconLogout, IconUserPlus, IconUsers } from "@tabler/icons-react";

export default function FamilyOnboarding({
  onCreate,
  onJoin,
  onSignOut,
  error,
}: {
  onCreate: (name: string) => void;
  onJoin: (code: string) => void;
  onSignOut: () => void;
  error?: string | null;
}) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("우리집");
  const [code, setCode] = useState("");

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 pt-10 font-sans text-foreground">
      <header className="flex items-center justify-between">
        <span className="text-base font-bold tracking-tight text-primary">담아락</span>
        <button
          type="button"
          onClick={onSignOut}
          className="flex min-h-11 items-center gap-1.5 rounded px-3 text-sm text-muted-foreground active:bg-chrome/60"
        >
          <IconLogout size={16} stroke={1.75} />
          로그아웃
        </button>
      </header>

      <div className="flex flex-1 flex-col pt-16 pb-16">
        {mode === "choose" && (
          <>
            <h1 className="text-3xl font-extrabold leading-snug text-foreground">
              아직 참여한
              <br />
              가족 공간이 없어요
            </h1>
            <p className="mt-3 text-sm font-medium text-muted-foreground">새로 만들거나, 초대 코드로 참여해보세요</p>

            <div className="mt-10 flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setMode("create")}
                className="flex min-h-16 items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-sm transition-colors active:bg-chrome/60"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconUsers size={22} stroke={2} />
                </span>
                <span>
                  <span className="block text-base font-bold text-foreground">가족 공간 만들기</span>
                  <span className="block mt-0.5 text-xs font-medium text-muted-foreground">우리집을 새로 시작해요</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("join")}
                className="flex min-h-16 items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-sm transition-colors active:bg-chrome/60"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-chrome text-chrome-foreground">
                  <IconUserPlus size={22} stroke={2} />
                </span>
                <span>
                  <span className="block text-base font-bold text-foreground">초대 코드로 참여하기</span>
                  <span className="block mt-0.5 text-xs font-medium text-muted-foreground">가족에게 받은 코드를 입력해요</span>
                </span>
              </button>
            </div>
          </>
        )}

        {mode === "create" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCreate(name.trim() || "우리집");
            }}
            className="flex flex-col gap-6"
          >
            <h1 className="text-2xl font-extrabold text-foreground">가족 공간 만들기</h1>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-foreground">가족 이름</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 우리집"
                className="h-14 rounded-xl border border-border/50 bg-background px-4 text-base text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-surface text-sm font-bold text-foreground shadow-sm active:bg-chrome/60"
              >
                뒤로
              </button>
              <button
                type="submit"
                className="flex min-h-14 flex-[2] items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
              >
                만들기
              </button>
            </div>
          </form>
        )}

        {mode === "join" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onJoin(code.trim());
            }}
            className="flex flex-col gap-6"
          >
            <h1 className="text-2xl font-extrabold text-foreground">초대 코드로 참여하기</h1>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-foreground">초대 코드</span>
              <input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="예: 742-819"
                className="h-14 rounded-xl border border-border/50 bg-background px-4 text-center text-xl font-bold tracking-widest text-foreground placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-medium shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-surface text-sm font-bold text-foreground shadow-sm active:bg-chrome/60"
              >
                뒤로
              </button>
              <button
                type="submit"
                disabled={!code.trim()}
                className="flex min-h-14 flex-[2] items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm transition-transform disabled:bg-chrome disabled:text-muted-foreground disabled:shadow-none active:scale-[0.98]"
              >
                참여하기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
