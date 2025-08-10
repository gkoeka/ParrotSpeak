-- Add was_completed column to conversation_metrics table
ALTER TABLE conversation_metrics 
ADD COLUMN IF NOT EXISTS was_completed BOOLEAN DEFAULT false;