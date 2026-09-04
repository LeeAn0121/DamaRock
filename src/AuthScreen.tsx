import { supabase } from "./lib/supabaseClient";

export default function AuthScreen() {
  const signIn = (provider: "google" | "kakao") =>
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 font-sans text-foreground">
      <span className="text-lg font-bold tracking-tight text-primary">담아락</span>
      <h1 className="mt-4 text-center text-2xl font-bold leading-snug text-foreground">
        가족과 함께
        <br />
        담아보세요
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
        장보기 목록과 할 일을 가족 모두가
        <br />
        실시간으로 함께 확인해요
      </p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={() => signIn("kakao")}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#FEE500] text-sm font-semibold text-[#191600] transition-transform active:scale-[0.98]"
        >
          카카오로 시작하기
        </button>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface text-sm font-semibold text-foreground transition-transform active:scale-[0.98]"
        >
          Google로 시작하기
        </button>
      </div>
    </div>
  );
}
