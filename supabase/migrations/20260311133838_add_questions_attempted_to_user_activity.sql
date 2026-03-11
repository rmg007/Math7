-- Add questions_attempted to user_activity for better heatmap tracking
ALTER TABLE public.user_activity
ADD COLUMN IF NOT EXISTS questions_attempted INTEGER DEFAULT 0;

COMMENT ON COLUMN public.user_activity.questions_attempted IS 'Count of questions attempted on this date.';
