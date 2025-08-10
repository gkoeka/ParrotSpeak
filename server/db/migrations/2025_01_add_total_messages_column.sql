-- Add total_messages column to conversation_metrics table
ALTER TABLE conversation_metrics 
ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;