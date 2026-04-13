export type NotificationType =
  | 'good'
  | 'bad'
  | 'warning'
  | 'class'
  | 'broadcast'
  | 'system';

export type NotificationPermissionState =
  | NotificationPermission
  | 'unsupported'
  | 'unknown';

export interface NotificationPayload {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  sound?: NotificationType | 'default';
  deepLink?: string | null;
  durationMs?: number;
  silent?: boolean;
  source?: 'engine' | 'fcm' | 'broadcast' | 'settings' | 'system';
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface NotificationToastItem extends NotificationPayload {
  id: string;
  createdAt: number;
}

export interface BroadcastNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  sound?: NotificationType | 'default';
  deepLink?: string | null;
}

export interface NotificationBroadcastEvent extends BroadcastNotificationPayload {
  issuedAt?: number;
}
