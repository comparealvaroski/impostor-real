import { useEffect, useRef, useState, useCallback } from 'react';
import { type GameMessage } from '@shared/schema';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<GameMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Map<string, (payload: any) => void>>(new Map());

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const message: GameMessage = JSON.parse(event.data);
        console.log('Received message:', message);
        setLastMessage(message);
        
        // Call specific handler if it exists
        const handler = messageHandlers.current.get(message.type);
        if (handler) {
          handler(message.payload);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (ws.current?.readyState !== WebSocket.OPEN) {
          connect();
        }
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload,
        timestamp: Date.now()
      };
      ws.current.send(JSON.stringify(message));
      console.log('Sent message:', message);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  const addMessageHandler = useCallback((type: string, handler: (payload: any) => void) => {
    messageHandlers.current.set(type, handler);
  }, []);

  const removeMessageHandler = useCallback((type: string) => {
    messageHandlers.current.delete(type);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    connect,
    disconnect
  };
}
