// Test metrics write to the new conversation_metrics table
import { SimpleMetricsService } from './server/services/simple-metrics';

async function testMetricsWrite() {
  console.log('Testing metrics write with METRICS_ENABLED =', process.env.METRICS_ENABLED);
  
  // Generate test UUIDs
  const testConversationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Write a test metric
  await SimpleMetricsService.writeMetric({
    conversationId: testConversationId,
    userId: testUserId,
    translateMs: 250,
    whisperMs: 150,
    ttsMs: 100,
    detectedLang: 'en',
    targetLang: 'es',
    voiceUsed: 'nova'
  });
  
  console.log('Test complete - check for [Metrics] write ok above');
}

// Run the test
testMetricsWrite().catch(console.error);