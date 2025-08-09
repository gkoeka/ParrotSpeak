import { API_BASE_URL } from '../api/config';

export interface WebSocketMessage {
  type: 'translation' | 'transcription' | 'error' | 'connection';
  data: any;
  messageId?: string;
  conversationId?: string;
}

export interface WebSocketConfig {
  onMessage: (message: WebSocketMessage) => void;
  onError: (error: Event) => void;
  onOpen: () => void;
  onClose: () => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isConnecting = false;

  private createSecureWebSocketUrl(baseUrl: string): string {
    try {
      const url = new URL(baseUrl);
      
      // Always use secure WebSocket protocol (wss://) for security
      // This ensures encrypted connections even in development
      url.protocol = 'wss:';
      
      return url.toString();
    } catch (error) {
      // Fallback for malformed URLs - always use secure protocol
      console.error('Error parsing WebSocket URL:', error);
      // If URL doesn't start with protocol, prepend wss://
      if (!baseUrl.match(/^wss?:\/\/|^https?:\/\//i)) {
        return `wss://${baseUrl}`;
      }
      // Always replace any protocol with wss://
      return baseUrl.replace(/^(https?|wss?):\/\//i, 'wss://');
    }
  }

  connect(config: WebSocketConfig) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.config = config;
    this.isConnecting = true;

    try {
      // Convert HTTP URL to secure WebSocket URL
      const wsUrl = this.createSecureWebSocketUrl(API_BASE_URL);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        console.log('WebSocket connected');
        this.config?.onOpen();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.config?.onMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.config?.onError(error);
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        console.log('WebSocket disconnected');
        this.config?.onClose();
        this.handleReconnect();
      };

    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.config) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.config) {
          this.connect(this.config);
        }
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.config = null;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): number | null {
    return this.ws ? this.ws.readyState : null;
  }
}

// Export a singleton instance
export const webSocketService = new WebSocketService();

// Helper functions for common WebSocket operations
export const sendTranslationRequest = (
  conversationId: string,
  text: string,
  sourceLanguage: string,
  targetLanguage: string
) => {
  webSocketService.send({
    type: 'translation',
    conversationId,
    data: {
      text,
      sourceLanguage,
      targetLanguage
    }
  });
};

export const sendTranscriptionRequest = (
  conversationId: string,
  audioData: string,
  language: string
) => {
  webSocketService.send({
    type: 'transcription',
    conversationId,
    data: {
      audioData,
      language
    }
  });
};