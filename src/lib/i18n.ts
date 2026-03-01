export type Locale = "en" | "ta";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "app.name": "ULA v2",
    "nav.overview": "Overview",
    "nav.coach": "AI Coach",
    "nav.goals": "Goals",
    "nav.activity": "Activity",
    "nav.predictions": "Predictions",
    "nav.explainable": "Explainable AI",
    "nav.accuracy": "Accuracy",
    "nav.settings": "Settings",
    "nav.signout": "Sign Out",
    "header.hello": "Hello",
    "header.subtitle": "Here's your life at a glance",
    "header.logData": "Log Data",
    "welcome.title": "Welcome to ULA v2!",
    "welcome.subtitle": "Start by logging your first data — screen time, steps, spending, or your life score. Your dashboard will populate as you track your daily habits.",
    "welcome.cta": "Log Your First Entry",
    "prediction.title": "Prediction Engine",
    "prediction.generate": "Generate Predictions",
    "prediction.risk": "Risk",
    "prediction.confidence": "Confidence",
    "prediction.feedback": "Was this helpful?",
    "prediction.helpful": "Helpful",
    "prediction.wrong": "Wrong",
    "prediction.tooFrequent": "Too frequent",
    "prediction.notRelevant": "Not relevant",
    "xai.title": "Explainable AI",
    "xai.featureImportance": "Feature Importance",
    "xai.whatIf": "What-If Simulator",
    "xai.counterfactual": "Counterfactual Suggestions",
    "xai.timeline": "Behavior Timeline",
    "accuracy.title": "Model Accuracy",
    "accuracy.domain": "Domain",
    "accuracy.accuracy": "Accuracy",
    "accuracy.usefulness": "Usefulness",
    "accuracy.predictions": "Predictions",
    "offline.badge": "Offline",
    "offline.syncing": "Syncing...",
    "offline.queued": "queued",
    "language.label": "Language",
    "language.en": "English",
    "language.ta": "தமிழ்",
  },
  ta: {
    "app.name": "ULA v2",
    "nav.overview": "கண்ணோட்டம்",
    "nav.coach": "AI பயிற்சியாளர்",
    "nav.goals": "இலக்குகள்",
    "nav.activity": "செயல்பாடு",
    "nav.predictions": "முன்கணிப்புகள்",
    "nav.explainable": "விளக்க AI",
    "nav.accuracy": "துல்லியம்",
    "nav.settings": "அமைப்புகள்",
    "nav.signout": "வெளியேறு",
    "header.hello": "வணக்கம்",
    "header.subtitle": "உங்கள் வாழ்க்கையின் ஒரு பார்வை",
    "header.logData": "தரவு பதிவு",
    "welcome.title": "ULA v2 க்கு வரவேற்கிறோம்!",
    "welcome.subtitle": "உங்கள் முதல் தரவை பதிவு செய்வதன் மூலம் தொடங்குங்கள் — திரை நேரம், அடிகள், செலவு அல்லது வாழ்க்கை மதிப்பெண். தினசரி பழக்கங்களை கண்காணிக்கும்போது உங்கள் டாஷ்போர்ட் புதுப்பிக்கப்படும்.",
    "welcome.cta": "முதல் பதிவை உள்ளிடுங்கள்",
    "prediction.title": "முன்கணிப்பு இயந்திரம்",
    "prediction.generate": "முன்கணிப்புகளை உருவாக்கு",
    "prediction.risk": "ஆபத்து",
    "prediction.confidence": "நம்பிக்கை",
    "prediction.feedback": "இது உதவியாக இருந்ததா?",
    "prediction.helpful": "உதவியானது",
    "prediction.wrong": "தவறானது",
    "prediction.tooFrequent": "அதிக அளவு",
    "prediction.notRelevant": "பொருத்தமில்லை",
    "xai.title": "விளக்க AI",
    "xai.featureImportance": "அம்ச முக்கியத்துவம்",
    "xai.whatIf": "என்றால் என்ன சிமுலேட்டர்",
    "xai.counterfactual": "மாற்று பரிந்துரைகள்",
    "xai.timeline": "நடத்தை காலவரிசை",
    "accuracy.title": "மாதிரி துல்லியம்",
    "accuracy.domain": "களம்",
    "accuracy.accuracy": "துல்லியம்",
    "accuracy.usefulness": "பயன்",
    "accuracy.predictions": "முன்கணிப்புகள்",
    "offline.badge": "ஆஃப்லைன்",
    "offline.syncing": "ஒத்திசைக்கிறது...",
    "offline.queued": "வரிசையில்",
    "language.label": "மொழி",
    "language.en": "English",
    "language.ta": "தமிழ்",
  },
};

export function t(key: string, locale: Locale = "en"): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

export function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem("ula-locale");
    if (stored === "ta" || stored === "en") return stored;
  } catch {}
  return "en";
}

export function setStoredLocale(locale: Locale) {
  try {
    localStorage.setItem("ula-locale", locale);
  } catch {}
}
