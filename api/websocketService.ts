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
  private hasLoggedInsecureWarning = false;

  private buildWebSocketURL(baseHttpUrl: string, path: string = '', opts?: { forceInsecure?: boolean }): string {
    try {
      const url = new URL(baseHttpUrl);
      
      // Environment checks
      const isProd = process.env.NODE_ENV === 'production';
      const allowDevInsecure = !isProd && process.env.ALLOW_INSECURE_WS === 'true';
      
      // Development-only allowlist for insecure connections
      const devAllowlist = new Set(['127.0.0.1', 'localhost', '10.0.2.2', '10.0.3.2']);
      
      // Determine WebSocket scheme
      const shouldUseInsecure = allowDevInsecure && devAllowlist.has(url.hostname) && opts?.forceInsecure !== false;
      const scheme = shouldUseInsecure ? 'ws' : 'wss';
      
      // Log warning once per session for insecure connections
      if (scheme === 'ws' && !this.hasLoggedInsecureWarning) {
        console.warn('⚠️ WARNING: Using insecure WebSocket connection (ws://). This should only be used in development.');
        this.hasLoggedInsecureWarning = true;
      }
      
      // Build the WebSocket URL
      url.protocol = scheme + ':';
      if (path) {
        url.pathname = url.pathname.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
      }
      
      return url.toString();
    } catch (error) {
      console.error('Error building WebSocket URL:', error);
      // Fallback - always use secure protocol
      const fallbackUrl = baseHttpUrl.replace(/^(https?|wss?):\/\//i, 'wss://');
      return path ? `${fallbackUrl}/${path.replace(/^\//, '')}` : fallbackUrl;
    }
  }

  connect(config: WebSocketConfig) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.config = config;
    this.isConnecting = true;

    try {
      // Build WebSocket URL with security defaults
      const wsUrl = this.buildWebSocketURL(API_BASE_URL, '/ws');
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