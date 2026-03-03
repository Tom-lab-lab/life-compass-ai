
-- User behavior clusters
CREATE TABLE public.user_behavior_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cluster_type text NOT NULL DEFAULT 'balanced',
  confidence_score numeric NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.user_behavior_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clusters" ON public.user_behavior_clusters FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX idx_user_behavior_clusters_user ON public.user_behavior_clusters(user_id);

-- Prediction events (real-time anomaly triggers)
CREATE TABLE public.prediction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trigger_type text NOT NULL,
  prediction_id uuid REFERENCES public.predictions(id),
  handled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.prediction_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prediction_events" ON public.prediction_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Life simulations (Digital Life Twin)
CREATE TABLE public.life_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  simulation_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  projected_outcomes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.life_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own simulations" ON public.life_simulations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add stability_score to ai_explanations
ALTER TABLE public.ai_explanations ADD COLUMN IF NOT EXISTS stability_score numeric DEFAULT 0;
