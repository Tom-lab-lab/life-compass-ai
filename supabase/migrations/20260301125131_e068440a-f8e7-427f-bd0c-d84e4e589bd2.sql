
-- Notification settings table
CREATE TABLE public.notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '07:00',
  quiet_hours_enabled boolean NOT NULL DEFAULT true,
  priority_threshold text NOT NULL DEFAULT 'normal',
  max_daily_notifications integer NOT NULL DEFAULT 20,
  anti_spam_enabled boolean NOT NULL DEFAULT true,
  channels jsonb NOT NULL DEFAULT '{"push": true, "email": false, "sms": false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification settings"
  ON public.notification_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- User consent table
CREATE TABLE public.user_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  consent_type text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, consent_type)
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own consents"
  ON public.user_consents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
