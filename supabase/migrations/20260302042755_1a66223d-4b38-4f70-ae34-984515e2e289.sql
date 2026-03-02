
-- Onboarding completion tracking
CREATE TABLE public.onboarding_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  completed boolean NOT NULL DEFAULT false,
  selected_goals text[] NOT NULL DEFAULT '{}',
  data_sources text[] NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding" ON public.onboarding_state FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_onboarding_state_updated_at BEFORE UPDATE ON public.onboarding_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Coaching history: tracks each coaching session
CREATE TABLE public.coaching_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.coaching_plans(id) ON DELETE SET NULL,
  session_type text NOT NULL DEFAULT 'daily_review',
  ai_analysis text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  predicted_improvement numeric DEFAULT 0,
  actual_improvement numeric,
  error_pct numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coaching_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own coaching_history" ON public.coaching_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Coaching feedback
CREATE TABLE public.coaching_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  history_id uuid REFERENCES public.coaching_history(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  was_helpful boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coaching_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own coaching_feedback" ON public.coaching_feedback FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI explanations storage
CREATE TABLE public.ai_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prediction_id uuid REFERENCES public.predictions(id) ON DELETE CASCADE,
  domain text NOT NULL DEFAULT 'general',
  top_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  feature_importance jsonb NOT NULL DEFAULT '{}',
  counterfactuals jsonb NOT NULL DEFAULT '[]'::jsonb,
  what_if_scenarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ai_explanations" ON public.ai_explanations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Audit logs for security tracking
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own audit_logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add deadline and domain to goals if not present
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS deadline date;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS domain text DEFAULT 'general';

-- Model retraining log for self-healing ML
CREATE TABLE public.model_retrain_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain text NOT NULL,
  trigger_reason text NOT NULL,
  old_version integer NOT NULL DEFAULT 1,
  new_version integer NOT NULL DEFAULT 2,
  old_accuracy numeric,
  new_accuracy numeric,
  drift_score numeric,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.model_retrain_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own model_retrain_log" ON public.model_retrain_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
