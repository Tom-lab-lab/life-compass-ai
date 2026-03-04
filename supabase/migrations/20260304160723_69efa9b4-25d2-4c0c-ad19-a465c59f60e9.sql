
-- Add structured goal variable columns to goals table
ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS priority_rank integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS constraints jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS qualitative_notes text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS risk_tolerance text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS time_budget_hours numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS financial_budget numeric DEFAULT NULL;
