import { db } from "@db";
import { sql } from "drizzle-orm";

interface ConversationMetric {
  conversationId: string;
  turnId?: string;
  userId?: string;
  recordMs?: number;
  fileBytes?: number;
  whisperMs?: number;
  translateMs?: number;
  ttsMs?: number;
  detectedLang?: string;
  targetLang?: string;
  voiceUsed?: string;
}

export class SimpleMetricsService {
  static async writeMetric(metric: ConversationMetric) {
    // Check if metrics are enabled
    if (process.env.METRICS_ENABLED !== 'true') {
      console.log('[Metrics] disabled');
      return;
    }

    try {
      // Insert directly into the conversation_metrics table
      const query = sql`
        INSERT INTO conversation_metrics (
          conversation_id,
          turn_id,
          user_id,
          record_ms,
          file_bytes,
          whisper_ms,
          translate_ms,
          tts_ms,
          detected_lang,
          target_lang,
          voice_used
        ) VALUES (
          ${metric.conversationId}::uuid,
          ${metric.turnId || null}::uuid,
          ${metric.userId || null}::uuid,
          ${metric.recordMs || null},
          ${metric.fileBytes || null},
          ${metric.whisperMs || null},
          ${metric.translateMs || null},
          ${metric.ttsMs || null},
          ${metric.detectedLang || null},
          ${metric.targetLang || null},
          ${metric.voiceUsed || null}
        )
      `;

      await db.execute(query);
      console.log('[Metrics] write ok');
    } catch (error) {
      console.error('[Metrics] write error:', error);
    }
  }
}