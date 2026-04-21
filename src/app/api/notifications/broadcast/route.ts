import { NextResponse } from 'next/server';

import type { BatchResponse, SendResponse, WebpushNotification } from 'firebase-admin/messaging';
import type { CollectionReference } from 'firebase-admin/firestore';

import type { BroadcastNotificationPayload, NotificationType } from '@/lib/notifications/types';
import {
  getFirebaseAdminMessaging,
  getNotificationTokenCollection,
  isFirebaseAdminConfigured,
} from '@/lib/server/firebase-admin';

const INVALID_TOKEN_ERRORS = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const RETRYABLE_ERRORS = new Set([
  'messaging/internal-error',
  'messaging/server-unavailable',
  'messaging/unknown-error',
]);

function getAdminSecret(request: Request) {
  return request.headers.get('x-admin-secret')
    || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    || '';
}

function sanitizeType(value: unknown): NotificationType {
  const validTypes: NotificationType[] = ['good', 'bad', 'warning', 'class', 'broadcast', 'system'];
  return validTypes.includes(value as NotificationType) ? value as NotificationType : 'broadcast';
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function sendBatchWithRetry(
  send: () => Promise<BatchResponse>,
  attempt = 1,
): Promise<BatchResponse> {
  const response = await send();

  if (response.failureCount === 0 || attempt >= 3) {
    return response;
  }

  const hasOnlyRetryableFailures = response.responses.every((item) => (
    item.success || RETRYABLE_ERRORS.has(item.error?.code || '')
  ));

  if (!hasOnlyRetryableFailures) {
    return response;
  }

  await sleep(250 * attempt);
  return sendBatchWithRetry(send, attempt + 1);
}

function buildWebpushNotification(
  payload: BroadcastNotificationPayload,
  absoluteUrl: string,
  notificationId: string,
): WebpushNotification {
  return {
    title: payload.title,
    body: payload.message,
    icon: '/icons/android-icon-192.png',
    badge: '/icons/android-icon-192.png',
    tag: `fcuk-${payload.type}-${notificationId}`,
    renotify: true,
    requireInteraction: payload.type === 'warning' || payload.type === 'bad',
    data: {
      id: notificationId,
      url: absoluteUrl,
      deepLink: payload.deepLink ?? '/',
      sound: payload.sound ?? 'default',
      type: payload.type,
    },
    vibrate: payload.type === 'bad' ? [120, 60, 120] : [80],
  };
}

async function cleanupInvalidTokens(
  responses: SendResponse[],
  tokens: string[],
  collection: CollectionReference,
) {
  await Promise.all(
    responses.map(async (item, index) => {
      if (item.success) return;

      const code = item.error?.code || '';
      if (!INVALID_TOKEN_ERRORS.has(code)) return;

      const invalidToken = tokens[index];
      if (!invalidToken) return;

      await collection.doc(invalidToken).delete().catch(() => undefined);
    }),
  );
}

export async function POST(request: Request) {
  const expectedSecret = process.env.ADMIN_SECRET;
  if (!expectedSecret || getAdminSecret(request) !== expectedSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message required' }, { status: 400 });
  }

  const payload: BroadcastNotificationPayload = {
    title,
    message,
    type: sanitizeType(body?.type),
    sound: typeof body?.sound === 'string' ? body.sound : sanitizeType(body?.type),
    deepLink: typeof body?.deepLink === 'string' ? body.deepLink : '/',
  };

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({
      delivered: false,
      reason: 'firebase_admin_not_configured',
    }, { status: 202 });
  }

  const collection = getNotificationTokenCollection();
  const messaging = getFirebaseAdminMessaging();
  if (!collection || !messaging) {
    return NextResponse.json({
      delivered: false,
      reason: 'messaging_unavailable',
    }, { status: 503 });
  }

  const snapshot = await collection.get();
  const tokens = snapshot.docs
    .map((document) => String(document.data().token || '').trim())
    .filter(Boolean);

  if (!tokens.length) {
    return NextResponse.json({
      delivered: true,
      sentCount: 0,
      reason: 'no_registered_tokens',
    });
  }

  const absoluteUrl = new URL(payload.deepLink ?? '/', request.url).toString();
  const notificationId = typeof body?.id === 'string' && body.id.trim()
    ? body.id.trim()
    : `${Date.now()}`;
  const webpushNotification = buildWebpushNotification(payload, absoluteUrl, notificationId);

  let successCount = 0;
  let failureCount = 0;

  for (const batch of chunkArray(tokens, 500)) {
    const response = await sendBatchWithRetry(() => messaging.sendEachForMulticast({
      tokens: batch,
      notification: {
        title: payload.title,
        body: payload.message,
      },
      data: {
        title: payload.title,
        message: payload.message,
        body: payload.message,
        type: payload.type,
        id: notificationId,
        sound: payload.sound ?? 'default',
        deepLink: payload.deepLink ?? '/',
        url: absoluteUrl,
      },
      webpush: {
        headers: {
          Urgency: payload.type === 'warning' || payload.type === 'bad' ? 'high' : 'normal',
          TTL: '2419200',
        },
        notification: webpushNotification,
        fcmOptions: {
          link: absoluteUrl,
        },
      },
    }));

    successCount += response.successCount;
    failureCount += response.failureCount;

    await cleanupInvalidTokens(response.responses, batch, collection);
  }

  return NextResponse.json({
    delivered: true,
    sentCount: successCount,
    failedCount: failureCount,
  });
}
