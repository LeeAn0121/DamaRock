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
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-background via-background to-primary/5 px-6 pt-10 font-sans text-foreground pb-10">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="담아락" className="h-6 w-6 rounded-md shadow-sm" />
          <span className="text-xl font-extrabold tracking-tight text-primary">담아락</span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-muted-foreground hover:bg-chrome/60 active:bg-chrome"
        >
          <IconLogout size={18} stroke={2} />
          로그아웃
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center pb-20">
        {mode === "choose" && (
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconUsers size={36} stroke={1.5} />
            </div>
            <h1 className="text-center text-3xl font-extrabold leading-tight text-foreground tracking-tight">
              아직 참여한<br />
              <span className="text-primary">가족 공간</span>이 없어요
            </h1>
            <p className="mt-4 text-center text-[15px] font-medium leading-relaxed text-muted-foreground">
              새로 만들거나 초대 코드로 참여해보세요.
            </p>

            <div className="mt-12 flex w-full max-w-sm flex-col gap-4">
              <button
                type="button"
                onClick={() => setMode("create")}
                className="group flex items-center gap-4 rounded-2xl bg-surface p-5 border border-border/40 shadow-sm transition-all hover:border-primary/40 active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <IconUsers size={22} stroke={2} />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-base font-bold text-foreground">가족 공간 만들기</span>
                  <span className="mt-0.5 text-[13px] font-medium text-muted-foreground group-hover:text-foreground/80">우리 가족만의 공간을 새로 시작해요</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("join")}
                className="group flex items-center gap-4 rounded-2xl bg-surface p-5 border border-border/40 shadow-sm transition-all hover:border-foreground/20 active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-chrome text-foreground shadow-sm">
                  <IconUserPlus size={22} stroke={2} />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-base font-bold text-foreground">초대 코드로 참여하기</span>
                  <span className="mt-0.5 text-[13px] font-medium text-muted-foreground group-hover:text-foreground/80">가족에게 받은 코드를 입력해요</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {mode === "create" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCreate(name.trim() || "우리집");
            }}
            className="flex w-full max-w-sm mx-auto flex-col gap-6"
          >
            <div className="text-center mb-4">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">가족 공간 만들기</h1>
              <p className="mt-2 text-[14px] text-muted-foreground">우리 가족이 모일 공간의 이름을 지어주세요.</p>
            </div>
            
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-bold text-foreground/80 ml-1">가족 이름</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 우리집"
                className="h-14 rounded-xl border border-border/60 bg-surface px-5 text-[15px] font-medium text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </label>
            {error && <p className="text-[13px] font-bold text-danger text-center bg-danger/10 py-2 rounded-lg">{error}</p>}
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-surface border border-border/60 text-[15px] font-bold text-foreground shadow-sm hover:bg-chrome transition-colors"
              >
                뒤로
              </button>
              <button
                type="submit"
                className="flex min-h-14 flex-[2] items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
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
            className="flex w-full max-w-sm mx-auto flex-col gap-6"
          >
            <div className="text-center mb-4">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">초대 코드로 참여하기</h1>
              <p className="mt-2 text-[14px] text-muted-foreground">전달받은 6자리 코드를 입력해주세요.</p>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-bold text-foreground/80 ml-1">초대 코드</span>
              <input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="예: 742-819"
                className="h-14 rounded-xl border border-border/60 bg-surface px-5 text-center text-xl font-bold tracking-widest text-foreground placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-medium shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
              />
            </label>
            {error && <p className="text-[13px] font-bold text-danger text-center bg-danger/10 py-2 rounded-lg">{error}</p>}
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-surface border border-border/60 text-[15px] font-bold text-foreground shadow-sm hover:bg-chrome transition-colors"
              >
                뒤로
              </button>
              <button
                type="submit"
                disabled={!code.trim()}
                className="flex min-h-14 flex-[2] items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-sm transition-transform disabled:bg-chrome disabled:text-muted-foreground disabled:shadow-none active:scale-[0.98]"
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
