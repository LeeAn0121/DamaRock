import { useI18n } from "../lib/i18n";

export default function TypingIndicator({ names }: { names: Record<string, string> }) {
  const { t } = useI18n();
  const list = Object.values(names);
  if (list.length === 0) return null;

  const text = list.length === 1
    ? t("typing.oneUser", { name: list[0] })
    : t("typing.multiUsers", { name: list[0], count: list.length - 1 });

  return (
    <p className="animate-in fade-in pb-1 text-xs italic text-muted-foreground duration-200">
      {text}
    </p>
  );
}
