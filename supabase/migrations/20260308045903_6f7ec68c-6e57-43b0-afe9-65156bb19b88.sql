
CREATE TABLE public.weekly_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_number integer NOT NULL,
  productivity_score integer NOT NULL DEFAULT 50,
  goal_progress integer NOT NULL DEFAULT 0,
  decision_accuracy integer NOT NULL DEFAULT 50,
  satisfaction_rating integer NOT NULL DEFAULT 50,
  feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weekly_feedback"
  ON public.weekly_feedback FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_feedback;
