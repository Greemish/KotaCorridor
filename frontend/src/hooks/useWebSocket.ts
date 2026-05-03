import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseWebSocketOptions {
  enabled: boolean;
  subscriptions: { topic: string; callback: (message: string) => void }[];
}

export const useWebSocket = ({ enabled, subscriptions }: UseWebSocketOptions) => {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('token');
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        subscriptions.forEach(({ topic, callback }) => {
          client.subscribe(topic, (msg) => callback(msg.body));
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return clientRef;
};
