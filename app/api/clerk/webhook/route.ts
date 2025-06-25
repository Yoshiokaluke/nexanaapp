import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    // Webhookの検証
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
    if (!WEBHOOK_SECRET) {
      console.error('Webhook secret is not configured')
      return new Response('サーバーの設定エラー', { status: 500 })
    }

    // ヘッダーの取得
    const headersList = await headers()
    const svix_id = headersList.get('svix-id')
    const svix_timestamp = headersList.get('svix-timestamp')
    const svix_signature = headersList.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing svix headers:', { svix_id, svix_timestamp, svix_signature })
      return new Response('必要なヘッダーが不足しています', { status: 400 })
    }

    // リクエストボディの取得と検証
    const payload = await req.json()
    const body = JSON.stringify(payload)

    const wh = new Webhook(WEBHOOK_SECRET)
    let evt: WebhookEvent

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent
    } catch (err) {
      console.error('Webhook検証エラー:', err)
      return new Response('Webhookの検証に失敗しました', { status: 400 })
    }

    // ユーザー作成イベントの処理
    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data
      const email = email_addresses[0]?.email_address

      if (!email) {
        console.error('メールアドレスが見つかりません:', evt.data)
        return new Response('メールアドレスが必要です', { status: 400 })
      }

      try {
        // 新しいユーザーを作成
        const user = await prisma.user.create({
          data: {
            clerkId: id,
            email: email,
            firstName: first_name ?? null,
            lastName: last_name ?? null,
          },
        })

        console.log('ユーザーを作成しました:', { userId: user.id, email: user.email })

        // システムチームユーザーの設定
        if (email === 'daiki.yoshioka@nexanahq.com') {
          await prisma.user.update({
            where: { id: user.id },
            data: { systemRole: 'system_team' },
          })
          console.log('システムチーム権限を付与しました:', { userId: user.id })
        }

        return new Response('ユーザーを作成しました', { status: 201 })
      } catch (error) {
        console.error('ユーザー作成エラー:', error)
        return new Response('ユーザーの作成に失敗しました', { status: 500 })
      }
    }

    return new Response('Webhookを受信しました', { status: 200 })
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return new Response('サーバーエラーが発生しました', { status: 500 })
  }
} 