
-- Predictions table: stores AI-generated predictions with accuracy tracking
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general', -- spending, study, screen_time, sleep, exercise, tasks
  prediction_text TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 50, -- 0-100
  confidence_score INTEGER NOT NULL DEFAULT 50, -- 0-100
  trend_direction TEXT NOT NULL DEFAULT 'stable', -- rising, falling, stable
  pattern_explanation TEXT,
  predicted_outcome JSONB DEFAULT '{}',
  actual_outcome JSONB DEFAULT NULL,
  accuracy_score NUMERIC DEFAULT NULL, -- calculated after outcome known
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, incorrect, expired
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own predictions" ON public.predictions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_predictions_user_domain ON public.predictions(user_id, domain);
CREATE INDEX idx_predictions_status ON public.predictions(user_id, status);

-- Prediction feedback: human-in-the-loop ratings
CREATE TABLE public.prediction_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL, -- helpful, wrong, too_frequent, not_relevant
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prediction_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own feedback" ON public.prediction_feedback FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User behavior profiles: adaptive per-user patterns
CREATE TABLE public.user_behavior_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  work_hours JSONB DEFAULT '{}', -- {"start": "09:00", "end": "18:00", "days": [1,2,3,4,5]}
  sleep_pattern JSONB DEFAULT '{}', -- {"avg_bedtime": "23:30", "avg_wake": "07:00"}
  spending_habits JSONB DEFAULT '{}', -- {"avg_daily": 500, "peak_day": "saturday", "categories": {...}}
  study_schedule JSONB DEFAULT '{}',
  stress_indicators JSONB DEFAULT '{}',
  detected_patterns JSONB DEFAULT '[]', -- AI-detected patterns
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_behavior_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own behavior profile" ON public.user_behavior_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Model metrics: track AI prediction performance over time
CREATE TABLE public.model_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC NOT NULL DEFAULT 0,
  avg_confidence NUMERIC NOT NULL DEFAULT 0,
  feedback_helpful INTEGER NOT NULL DEFAULT 0,
  feedback_wrong INTEGER NOT NULL DEFAULT 0,
  feedback_total INTEGER NOT NULL DEFAULT 0,
  usefulness_rate NUMERIC NOT NULL DEFAULT 0, -- helpful / total feedback
  drift_score NUMERIC NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own model metrics" ON public.model_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_model_metrics_user_domain ON public.model_metrics(user_id, domain);

-- Add updated_at trigger for behavior profiles
CREATE TRIGGER update_behavior_profiles_updated_at BEFORE UPDATE ON public.user_behavior_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
