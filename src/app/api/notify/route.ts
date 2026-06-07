import { NextResponse } from 'next/server';
import { adminMessaging } from '@/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { APP_ID } from '@/app/lib/constants';

export async function POST(req: Request) {
  if (!adminMessaging) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { title, message, userId, url } = body;

    if (!title || !message || !userId) {
      return NextResponse.json({ error: 'Missing required fields: title, message, userId' }, { status: 400 });
    }

    const db = getFirestore();
    const userDoc = await db.collection(`artifacts/${APP_ID}/users`).doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const tokens = userData?.fcmTokens as string[] | undefined;

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ success: false, message: 'No FCM tokens found for user' }, { status: 200 });
    }

    // Clean up dead tokens
    const tokensToRemove: string[] = [];
    const validTokens: string[] = [];

    const sendPromises = tokens.map(async (token) => {
        try {
            await adminMessaging.send({
                token,
                notification: {
                    title,
                    body: message,
                },
                webpush: {
                    fcmOptions: {
                        link: url || '/',
                    },
                    notification: {
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/icon-96x96.png',
                        vibrate: [200, 100, 200],
                    }
                }
            });
            validTokens.push(token);
        } catch (error: any) {
            console.error(`Error sending to token ${token}:`, error);
            if (error.code === 'messaging/invalid-registration-token' || 
                error.code === 'messaging/registration-token-not-registered') {
                tokensToRemove.push(token);
            }
        }
    });

    await Promise.all(sendPromises);

    // Remove invalid tokens from Firestore
    if (tokensToRemove.length > 0) {
       await userDoc.ref.update({
           fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
       });
    }

    return NextResponse.json({ success: true, sentCount: validTokens.length });

  } catch (error: any) {
    console.error('Error in /api/notify:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
