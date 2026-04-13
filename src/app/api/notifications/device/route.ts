import { NextResponse } from 'next/server';

import { getNotificationTokenCollection, hashNotificationToken, isFirebaseAdminConfigured } from '@/lib/server/firebase-admin';
import { handleRouteError, requireSession } from '@/lib/server/route-utils';

export async function POST(request: Request) {
  try {
    const { sessionId, session, response } = await requireSession();
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ synced: false, reason: 'firebase_admin_not_configured' }, { status: 202 });
    }

    const collection = getNotificationTokenCollection();
    if (!collection) {
      return NextResponse.json({ synced: false, reason: 'token_store_unavailable' }, { status: 503 });
    }

    const docId = hashNotificationToken(token);
    const now = new Date().toISOString();
    const existing = await collection.doc(docId).get();

    await collection.doc(docId).set({
      token,
      email: session?.email ?? null,
      sessionId,
      permission: typeof body?.permission === 'string' ? body.permission : null,
      platform: typeof body?.platform === 'string' ? body.platform : request.headers.get('user-agent'),
      createdAt: existing.exists ? existing.data()?.createdAt ?? now : now,
      updatedAt: now,
    }, { merge: true });

    return NextResponse.json({ synced: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    if (!token) {
      return NextResponse.json({ removed: true });
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ removed: true, reason: 'firebase_admin_not_configured' });
    }

    const collection = getNotificationTokenCollection();
    if (!collection) {
      return NextResponse.json({ removed: false, reason: 'token_store_unavailable' }, { status: 503 });
    }

    await collection.doc(hashNotificationToken(token)).delete();
    return NextResponse.json({ removed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
