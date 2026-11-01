"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { getPusherClient, NOTIFICATION_CHANNEL, NOTIFICATION_EVENT } from "@/lib/pusherClient";
import { registerLocalNotifier } from "@/lib/notify";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  isConnected: boolean;
  // Shows a notification in THIS tab immediately, without waiting on a
  // round trip through /api/notify -> Pusher -> this tab's socket. That
  // round trip is how OTHER tabs/devices hear about the action, but the
  // tab that triggered the action shouldn't have to depend on Pusher
  // being configured (or the socket being connected yet) just to see
  // feedback for its own action.
  addNotification: (title: string, body?: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

// How long to remember a locally-added notification's "fingerprint" so
// that if the matching Pusher event later bounces back to this same
// tab, we recognize it as a duplicate and drop it instead of showing
// the same notification twice.
const DEDUPE_WINDOW_MS = 8000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const recentLocalRef = useRef<Map<string, number>>(new Map());

  const pushNotificationToState = useCallback((entry: AppNotification) => {
    setNotifications((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const addNotification = useCallback((title: string, body = "") => {
    const timestamp = new Date().toISOString();
    const fingerprint = `${title}|${body}`;
    recentLocalRef.current.set(fingerprint, Date.now());

    pushNotificationToState({
      id: `local-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      body,
      timestamp,
      read: false
    });
  }, [pushNotificationToState]);

  // lib/notify.ts's pushNotification() calls this so that ANY page in
  // ANY portal gets an instant in-tab notification without having to
  // reach for the context itself.
  useEffect(() => {
    registerLocalNotifier(addNotification);
    return () => registerLocalNotifier(null);
  }, [addNotification]);

  // Subscribes once, on mount, to the shared Pusher channel. Any
  // browser tab (including other tabs/devices) that triggers a
  // notification via POST /api/notify will show up here in real time,
  // with no polling. The tab that actually performed the action gets
  // its own instant copy via addNotification() above, so this listener
  // filters out that duplicate when it bounces back.
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(NOTIFICATION_CHANNEL);

    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    pusher.connection.bind("connected", handleConnected);
    pusher.connection.bind("disconnected", handleDisconnected);
    pusher.connection.bind("unavailable", handleDisconnected);
    if (pusher.connection.state === "connected") setIsConnected(true);

    channel.bind(
      NOTIFICATION_EVENT,
      (data: { title: string; body?: string; timestamp: string }) => {
        const body = data.body ?? "";
        const fingerprint = `${data.title}|${body}`;
        const localAt = recentLocalRef.current.get(fingerprint);

        if (localAt && Date.now() - localAt < DEDUPE_WINDOW_MS) {
          // This is this tab's own action bouncing back through Pusher.
          // Already shown via addNotification(), so drop it and clear
          // the fingerprint so a later, distinct event with the same
          // text isn't accidentally swallowed too.
          recentLocalRef.current.delete(fingerprint);
          return;
        }

        pushNotificationToState({
          id: `${data.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
          title: data.title,
          body,
          timestamp: data.timestamp,
          read: false
        });
      }
    );

    return () => {
      channel.unbind(NOTIFICATION_EVENT);
      pusher.unsubscribe(NOTIFICATION_CHANNEL);
      pusher.connection.unbind("connected", handleConnected);
      pusher.connection.unbind("disconnected", handleDisconnected);
      pusher.connection.unbind("unavailable", handleDisconnected);
    };
  }, [pushNotificationToState]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, isConnected, addNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
