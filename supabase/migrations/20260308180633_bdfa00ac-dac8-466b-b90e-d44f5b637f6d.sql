
CREATE TABLE public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  feature_name text NOT NULL,
  action_details text,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own activity logs"
ON public.user_activity_logs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_action_type ON public.user_activity_logs(action_type);
CREATE INDEX idx_user_activity_logs_feature_name ON public.user_activity_logs(feature_name);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);
