
-- Fix RLS: Drop restrictive policies and recreate as permissive

-- activity_logs
DROP POLICY IF EXISTS "Users manage own activity_logs" ON public.activity_logs;
CREATE POLICY "Users manage own activity_logs" ON public.activity_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- coaching_plans
DROP POLICY IF EXISTS "Users manage own coaching_plans" ON public.coaching_plans;
CREATE POLICY "Users manage own coaching_plans" ON public.coaching_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- daily_tasks
DROP POLICY IF EXISTS "Users manage own daily_tasks" ON public.daily_tasks;
CREATE POLICY "Users manage own daily_tasks" ON public.daily_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- goals
DROP POLICY IF EXISTS "Users manage own goals" ON public.goals;
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- interventions
DROP POLICY IF EXISTS "Users manage own interventions" ON public.interventions;
CREATE POLICY "Users manage own interventions" ON public.interventions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- life_scores
DROP POLICY IF EXISTS "Users manage own life_scores" ON public.life_scores;
CREATE POLICY "Users manage own life_scores" ON public.life_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- nudges
DROP POLICY IF EXISTS "Users manage own nudges" ON public.nudges;
CREATE POLICY "Users manage own nudges" ON public.nudges FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Recreate triggers (they exist as functions but triggers are missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_coaching_plans_updated_at ON public.coaching_plans;
CREATE TRIGGER update_coaching_plans_updated_at BEFORE UPDATE ON public.coaching_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_interventions_updated_at ON public.interventions;
CREATE TRIGGER update_interventions_updated_at BEFORE UPDATE ON public.interventions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
