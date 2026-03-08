
CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  productivity_score integer NOT NULL DEFAULT 5,
  sleep_hours numeric NOT NULL DEFAULT 7,
  exercise_done boolean NOT NULL DEFAULT false,
  spending_amount numeric NOT NULL DEFAULT 0,
  stress_level integer NOT NULL DEFAULT 5,
  optional_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily_checkins"
ON public.daily_checkins
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins(user_id, date);
