// Simple test to verify metrics are disabled
import { InternalAnalyticsService } from './server/services/internal-analytics';

console.log('Testing metrics with METRICS_ENABLED =', process.env.METRICS_ENABLED);

// Test updateConversationMetrics
InternalAnalyticsService.updateConversationMetrics('test-conversation-id', {
  isUser: true,
  translationTime: 100
});

// Test startConversationTracking
InternalAnalyticsService.startConversationTracking('test-conversation-id', 123);

console.log('Test complete - check for [Metrics] disabled logs above');
