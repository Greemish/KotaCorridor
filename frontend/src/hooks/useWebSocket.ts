import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseWebSocketOptions {
  enabled: boolean;
  subscriptions: { topic: string; handler: (message: unknown) => void }[];
}

export function useWebSocket({ enabled, subscriptions }: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    const stored = localStorage.getItem('kota_user');
    const token = stored ? JSON.parse(stored).token : null;

    const stompClient = new Client({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webSocketFactory: () => new (SockJS as any)('/ws'),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        subscriptions.forEach(({ topic, handler }) => {
          stompClient.subscribe(topic, (msg) => {
            try {
              handler(JSON.parse(msg.body));
            } catch {
              handler(msg.body);
            }
          });
        });
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;
  }, [subscriptions]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      clientRef.current?.deactivate();
    };
  }, [enabled, connect]);
}
