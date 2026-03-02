import { Globe } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import type { Locale } from "@/lib/i18n";

const locales: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ta", label: "தமிழ்" },
  { value: "hi", label: "हिन्दी" },
];

const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useLocale();

  const cycle = () => {
    const idx = locales.findIndex((l) => l.value === locale);
    const next = locales[(idx + 1) % locales.length];
    setLocale(next.value);
  };

  const currentLabel = locales.find((l) => l.value === locale)?.label || "English";

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      title={t("language.label")}
    >
      <Globe className="h-3.5 w-3.5" />
      {currentLabel}
    </button>
  );
};

export default LanguageSwitcher;
