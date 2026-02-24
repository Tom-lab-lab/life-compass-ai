// Mock data for ULA v2 dashboard

export const lifeScore = {
  overall: 74,
  breakdown: {
    productivity: 82,
    wellbeing: 68,
    financial: 71,
    physical: 76,
    digital: 65,
  },
  trend: +3,
};

export const productivityForecast = {
  predicted: 78,
  confidence: 0.85,
  riskFactors: [
    { label: "High screen time trend", impact: -8, severity: "high" as const },
    { label: "Irregular sleep pattern", impact: -5, severity: "medium" as const },
    { label: "Pending financial stress", impact: -3, severity: "low" as const },
  ],
  history: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    score: 60 + Math.round(Math.random() * 25 + Math.sin(i / 5) * 10),
    predicted: i > 22 ? 65 + Math.round(Math.random() * 20) : undefined,
  })),
};

export const screenTimeData = Array.from({ length: 7 }, (_, i) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    day: days[i],
    social: Math.round(40 + Math.random() * 80),
    productive: Math.round(60 + Math.random() * 120),
    entertainment: Math.round(20 + Math.random() * 60),
  };
});

export const activityData = Array.from({ length: 7 }, (_, i) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    day: days[i],
    steps: Math.round(4000 + Math.random() * 8000),
    goal: 8000,
  };
});

export const spendingData = [
  { category: "Food", amount: 12400, color: "hsl(168, 76%, 40%)" },
  { category: "Transport", amount: 4200, color: "hsl(190, 80%, 50%)" },
  { category: "Shopping", amount: 8600, color: "hsl(38, 92%, 55%)" },
  { category: "Bills", amount: 15000, color: "hsl(265, 70%, 60%)" },
  { category: "Entertainment", amount: 3200, color: "hsl(0, 72%, 55%)" },
];

export const coachingPlan = [
  { day: 1, task: "Set 3 daily focus goals", category: "Productivity", done: true },
  { day: 2, task: "Limit social media to 45 min", category: "Digital", done: true },
  { day: 3, task: "Walk 8000 steps", category: "Physical", done: true },
  { day: 4, task: "Review weekly spending", category: "Financial", done: false },
  { day: 5, task: "Complete 2 deep work sessions", category: "Productivity", done: false },
  { day: 6, task: "No phone first 30 min after waking", category: "Digital", done: false },
  { day: 7, task: "Prepare weekly meal plan", category: "Wellbeing", done: false },
  { day: 8, task: "Set monthly savings target", category: "Financial", done: false },
  { day: 9, task: "Try a 10-min meditation", category: "Wellbeing", done: false },
  { day: 10, task: "Batch-process emails twice daily", category: "Productivity", done: false },
];

export const interventionEffectiveness = [
  { name: "Focus mode reminders", accepted: 82, ignored: 18, impact: 12 },
  { name: "Step goal nudges", accepted: 65, ignored: 35, impact: 8 },
  { name: "Spending alerts", accepted: 71, ignored: 29, impact: 15 },
  { name: "Sleep schedule prompts", accepted: 45, ignored: 55, impact: 6 },
  { name: "Break reminders", accepted: 78, ignored: 22, impact: 10 },
];

export const heatmapData = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hour) => ({
    day,
    hour,
    value: Math.round(Math.random() * 100),
  }))
).flat();

export const goals = [
  { id: 1, title: "Reduce screen time to 4h/day", progress: 65, target: "4h", current: "5.2h", category: "Digital" },
  { id: 2, title: "Walk 8000 steps daily", progress: 78, target: "8000", current: "6240", category: "Physical" },
  { id: 3, title: "Save ₹5000 this month", progress: 42, target: "₹5000", current: "₹2100", category: "Financial" },
  { id: 4, title: "Complete 20 focus sessions", progress: 55, target: "20", current: "11", category: "Productivity" },
];

export const nudges = [
  { id: 1, message: "You've been on Instagram for 25 min — time for a break?", type: "warning" as const, time: "2 min ago" },
  { id: 2, message: "Great job! You hit 6000 steps. Keep going for your goal!", type: "success" as const, time: "15 min ago" },
  { id: 3, message: "Unusual spending detected: ₹2400 on Swiggy today", type: "info" as const, time: "1h ago" },
];
