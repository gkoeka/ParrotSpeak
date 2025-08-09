CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS conversation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  turn_id UUID,
  user_id UUID,
  record_ms INTEGER,
  file_bytes INTEGER,
  whisper_ms INTEGER,
  translate_ms INTEGER,
  tts_ms INTEGER,
  detected_lang TEXT,
  target_lang TEXT,
  voice_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_metrics_conversation ON conversation_metrics(conversation_id, created_at DESC);