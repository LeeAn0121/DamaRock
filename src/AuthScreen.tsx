import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

function KakaoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#191600"
        d="M9 2C4.86 2 1.5 4.69 1.5 8c0 2.11 1.37 3.97 3.43 5.03-.15.55-.55 2-.63 2.3 0 0-.01.1.05.14.06.04.13.02.13.02.18-.03 2.06-1.35 2.87-1.91.53.08 1.08.12 1.65.12 4.14 0 7.5-2.69 7.5-6S13.14 2 9 2z"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AuthScreen() {
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const errDesc = params.get("error_description") || hash.get("error_description");
    if (errDesc) {
      if (errDesc.includes("already registered") || errDesc.includes("different credential")) {
        setAuthError("이미 다른 소셜 계정(카카오 또는 구글)으로 가입된 이메일입니다. 기존 계정으로 로그인해주세요.");
      } else {
        setAuthError(errDesc);
      }
      // clear error from url
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const signIn = (provider: "google" | "kakao") =>
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 font-sans text-foreground pb-10">
      <span className="text-xl font-extrabold tracking-tight text-primary">투게더리</span>
      <h1 className="mt-5 text-center text-3xl font-extrabold leading-snug text-foreground">
        우리집 장보기와 할 일을
        <br />
        가족과 한곳에 모아요.
      </h1>
      <p className="mt-4 text-center text-sm font-medium leading-relaxed text-muted-foreground">
        누가 적어도 그 순간 모두의 화면에 함께 채워져요.
        <br />
        초대 코드 하나면 가족과 바로 시작해요.
      </p>

      <div className="mt-8 flex flex-col gap-4 text-sm font-medium text-foreground">
        <ul className="flex flex-col gap-2 rounded-2xl bg-surface p-5 shadow-sm border border-primary/20 text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-primary">•</span> 장보기 탭과 할일 탭, 따로 또 같이</li>
          <li className="flex items-start gap-2"><span className="text-primary">•</span> 항목 안에서 메모와 댓글로 바로 상의해요</li>
          <li className="flex items-start gap-2"><span className="text-primary">•</span> 폴더로 우리 방식대로 정리, 검색은 한 번에</li>
          <li className="flex items-start gap-2"><span className="text-primary">•</span> 마감일 있는 할일은 캘린더로 한눈에</li>
        </ul>
      </div>

      <div className="mt-12 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={() => signIn("kakao")}
          className="relative flex min-h-14 items-center justify-center rounded-xl bg-[#FEE500] text-sm font-bold text-[#191600] shadow-sm transition-transform active:scale-[0.98]"
        >
          <span className="absolute left-5 flex items-center">
            <KakaoMark />
          </span>
          카카오로 시작하기
        </button>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="relative flex min-h-14 items-center justify-center rounded-xl border border-border/50 bg-surface text-sm font-bold text-foreground shadow-sm transition-transform active:scale-[0.98]"
        >
          <span className="absolute left-5 flex items-center">
            <GoogleMark />
          </span>
          Google로 시작하기
        </button>

        {authError && (
          <div className="mt-4 rounded-xl bg-danger/10 p-4 text-center text-sm font-medium text-danger">
            {authError}
          </div>
        )}
      </div>
    </div>
  );
}
