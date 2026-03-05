-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.model_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.life_simulations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prediction_feedback;