import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Target,
  Shield,
  Bell,
  Database,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  Dumbbell,
  Wallet,
  Brain,
  Zap,
  Loader2,
} from "lucide-react";

const GOAL_OPTIONS = [
  { id: "study", icon: BookOpen, label: "Study & Learning", labelTa: "படிப்பு", labelHi: "पढ़ाई" },
  { id: "fitness", icon: Dumbbell, label: "Fitness & Health", labelTa: "உடற்பயிற்சி", labelHi: "फिटनेस" },
  { id: "finance", icon: Wallet, label: "Finance & Savings", labelTa: "நிதி", labelHi: "वित्त" },
  { id: "mental_health", icon: Brain, label: "Mental Wellbeing", labelTa: "மன நலம்", labelHi: "मानसिक स्वास्थ्य" },
  { id: "productivity", icon: Zap, label: "Productivity", labelTa: "உற்பத்தித்திறன்", labelHi: "उत्पादकता" },
];

const DATA_SOURCE_OPTIONS = [
  { id: "manual", label: "Manual Logging", desc: "Log data yourself daily" },
  { id: "csv", label: "CSV Upload", desc: "Import from spreadsheets" },
  { id: "wearable", label: "Wearable (Coming Soon)", desc: "Google Fit / Apple Health", disabled: true },
  { id: "bank_sms", label: "Bank SMS (India)", desc: "Auto-parse expense messages", disabled: true },
];

interface Props {
  onComplete: () => void;
}

const OnboardingWizard = ({ onComplete }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useLocale();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    ai_training: true,
    data_sharing: false,
  });
  const [notifSettings, setNotifSettings] = useState({
    push: true,
    email: false,
    quiet_hours: true,
  });
  const [dataSources, setDataSources] = useState<string[]>(["manual"]);

  const toggleGoal = (id: string) =>
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const toggleDataSource = (id: string) =>
    setDataSources((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save onboarding state
      await supabase.from("onboarding_state").upsert({
        user_id: user.id,
        completed: true,
        selected_goals: selectedGoals,
        data_sources: dataSources,
        completed_at: new Date().toISOString(),
      });

      // Save notification settings
      await supabase.from("notification_settings").upsert({
        user_id: user.id,
        channels: notifSettings,
        quiet_hours_enabled: notifSettings.quiet_hours,
      });

      // Save privacy consents
      const consents = Object.entries(privacySettings).map(([type, granted]) => ({
        user_id: user.id,
        consent_type: type,
        granted,
        granted_at: granted ? new Date().toISOString() : null,
      }));
      for (const consent of consents) {
        await supabase.from("user_consents").upsert(consent, {
          onConflict: "user_id,consent_type",
        });
      }

      // Create initial goals
      for (const goalId of selectedGoals) {
        const goalOption = GOAL_OPTIONS.find((g) => g.id === goalId);
        if (goalOption) {
          await supabase.from("goals").insert({
            user_id: user.id,
            title: `Improve ${goalOption.label}`,
            category: goalId === "study" ? "Productivity" : goalId === "fitness" ? "Physical" : goalId === "finance" ? "Financial" : goalId === "mental_health" ? "Wellbeing" : "Productivity",
          });
        }
      }

      toast({ title: "Welcome to ULA! 🎉", description: "Your dashboard is ready. Start logging data!" });
      onComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { icon: Sparkles, title: "Welcome", titleTa: "வரவேற்பு", titleHi: "स्वागत" },
    { icon: Target, title: "Select Goals", titleTa: "இலக்குகள்", titleHi: "लक्ष्य चुनें" },
    { icon: Shield, title: "Privacy", titleTa: "தனியுரிமை", titleHi: "गोपनीयता" },
    { icon: Bell, title: "Notifications", titleTa: "அறிவிப்புகள்", titleHi: "सूचनाएं" },
    { icon: Database, title: "Data Sources", titleTa: "தரவு", titleHi: "डेटा स्रोत" },
  ];

  const canProceed =
    step === 0 ||
    (step === 1 && selectedGoals.length > 0) ||
    step === 2 ||
    step === 3 ||
    step === 4;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-gradient-primary text-primary-foreground glow-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-6 rounded ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 0 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              {locale === "ta" ? "ULA v2 க்கு வரவேற்கிறோம்!" : locale === "hi" ? "ULA v2 में स्वागत है!" : "Welcome to ULA v2!"}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {locale === "ta"
                ? "உங்கள் AI-உதவியாளர் உங்கள் வாழ்க்கையை மேம்படுத்த தயாராக உள்ளது."
                : locale === "hi"
                ? "आपका AI-सहायक आपकी जीवनशैली को बेहतर बनाने के लिए तैयार है।"
                : "Your AI-powered life assistant is ready to help you build better habits and reach your goals."}
            </p>
            <p className="text-xs text-muted-foreground">
              {locale === "ta"
                ? "இந்த அமைப்பு 2 நிமிடங்கள் எடுக்கும்."
                : locale === "hi"
                ? "इस सेटअप में 2 मिनट लगेंगे।"
                : "This quick setup takes about 2 minutes. No fake data — you start from zero."}
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="mb-1 text-lg font-bold text-foreground">
              {locale === "ta" ? "உங்கள் இலக்குகளைத் தேர்ந்தெடுக்கவும்" : locale === "hi" ? "अपने लक्ष्य चुनें" : "What do you want to improve?"}
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">Select one or more areas to focus on.</p>
            <div className="space-y-2">
              {GOAL_OPTIONS.map((goal) => {
                const selected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/10 glow-primary"
                        : "border-border bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <goal.icon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                      {locale === "ta" ? goal.labelTa : locale === "hi" ? goal.labelHi : goal.label}
                    </span>
                    {selected && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-1 text-lg font-bold text-foreground">
              {locale === "ta" ? "தனியுரிமை அமைப்புகள்" : locale === "hi" ? "गोपनीयता सेटिंग्स" : "Privacy Settings"}
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">Control how your data is used. You can change these anytime.</p>
            <div className="space-y-4">
              {[
                { key: "analytics", label: "Usage Analytics", desc: "Help us improve ULA with anonymous usage data" },
                { key: "ai_training", label: "AI Personalization", desc: "Use your data to improve AI predictions" },
                { key: "data_sharing", label: "Research Sharing", desc: "Contribute anonymized data to academic research" },
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings[item.key as keyof typeof privacySettings]}
                    onChange={(e) =>
                      setPrivacySettings((s) => ({ ...s, [item.key]: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 rounded accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="mb-1 text-lg font-bold text-foreground">
              {locale === "ta" ? "அறிவிப்பு விருப்பங்கள்" : locale === "hi" ? "सूचना प्राथमिकताएं" : "Notification Preferences"}
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">Choose how ULA reaches out to you.</p>
            <div className="space-y-4">
              {[
                { key: "push", label: "Push Notifications", desc: "Nudges and reminders in your browser" },
                { key: "email", label: "Email Digest", desc: "Weekly summary of your progress" },
                { key: "quiet_hours", label: "Quiet Hours (10PM–7AM)", desc: "No notifications during sleep" },
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings[item.key as keyof typeof notifSettings]}
                    onChange={(e) =>
                      setNotifSettings((s) => ({ ...s, [item.key]: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 rounded accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="mb-1 text-lg font-bold text-foreground">
              {locale === "ta" ? "தரவு மூலங்கள்" : locale === "hi" ? "डेटा स्रोत" : "How will you log data?"}
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">Select your preferred data input methods.</p>
            <div className="space-y-2">
              {DATA_SOURCE_OPTIONS.map((src) => {
                const selected = dataSources.includes(src.id);
                return (
                  <button
                    key={src.id}
                    onClick={() => !src.disabled && toggleDataSource(src.id)}
                    disabled={src.disabled}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      src.disabled
                        ? "border-border bg-muted/10 opacity-50 cursor-not-allowed"
                        : selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                        {src.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{src.desc}</p>
                    </div>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="flex items-center gap-1 rounded-lg bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {step === 0 ? "Get Started" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Setting up..." : "Launch Dashboard"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
