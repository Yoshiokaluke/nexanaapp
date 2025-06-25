import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Webhookシークレットの検証
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  // ヘッダーの取得
  const headersList = await headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  // 必要なヘッダーの確認
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // リクエストボディの取得
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Webhookの検証
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occured', {
      status: 400,
    });
  }

  // イベントタイプに基づいて処理
  try {
    switch (evt.type) {
      case 'user.created':
        await prisma.user.create({
          data: {
            clerkId: evt.data.id,
            email: evt.data.email_addresses[0]?.email_address ?? '',
            firstName: evt.data.first_name ?? null,
            lastName: evt.data.last_name ?? null,
          },
        });
        break;

      case 'user.updated':
        await prisma.user.update({
          where: { clerkId: evt.data.id },
          data: {
            email: evt.data.email_addresses[0]?.email_address ?? '',
            firstName: evt.data.first_name ?? null,
            lastName: evt.data.last_name ?? null,
          },
        });
        break;

      case 'user.deleted':
        await prisma.user.delete({
          where: { clerkId: evt.data.id },
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', {
      status: 500,
    });
  }
} 