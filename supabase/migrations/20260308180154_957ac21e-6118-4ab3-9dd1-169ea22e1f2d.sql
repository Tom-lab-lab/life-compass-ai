
-- Drop existing restrictive policies on audit_logs
DROP POLICY IF EXISTS "Users read own audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users insert own audit_logs" ON public.audit_logs;

-- Create permissive policies instead
CREATE POLICY "Users read own audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
