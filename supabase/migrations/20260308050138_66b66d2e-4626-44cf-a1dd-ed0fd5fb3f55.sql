
-- Recommendation history table for tracking AI recommendations and outcomes
CREATE TABLE public.recommendation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recommendation_type text NOT NULL DEFAULT 'decision_engine',
  recommendation_text text NOT NULL,
  contributing_factors jsonb NOT NULL DEFAULT '[]',
  expected_outcome jsonb NOT NULL DEFAULT '{}',
  actual_outcome jsonb,
  accuracy_score numeric,
  mcda_weights jsonb NOT NULL DEFAULT '{}',
  mcda_scores jsonb NOT NULL DEFAULT '{}',
  was_accepted boolean,
  user_rating integer,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recommendation_history"
  ON public.recommendation_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Experiment results table for synthetic profile testing
CREATE TABLE public.experiment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  experiment_name text NOT NULL,
  profile_count integer NOT NULL DEFAULT 50,
  method text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}',
  raw_results jsonb NOT NULL DEFAULT '[]',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own experiment_results"
  ON public.experiment_results FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.recommendation_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.experiment_results;
