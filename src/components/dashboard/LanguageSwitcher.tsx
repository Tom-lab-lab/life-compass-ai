import { Globe } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import type { Locale } from "@/lib/i18n";

const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useLocale();

  const toggle = () => {
    const next: Locale = locale === "en" ? "ta" : "en";
    setLocale(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      title={t("language.label")}
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === "en" ? "தமிழ்" : "English"}
    </button>
  );
};

export default LanguageSwitcher;
