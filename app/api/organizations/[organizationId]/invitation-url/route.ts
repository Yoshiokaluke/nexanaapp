import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { checkOrganizationAdmin } from '@/lib/auth/roles';
import { randomBytes } from 'crypto';

// 招待URL一覧の取得
export async function GET(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isAdmin = await checkOrganizationAdmin(userId, params.organizationId);
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 期限切れの招待を削除
    await prisma.organizationInvitation.deleteMany({
      where: { 
        organizationId: params.organizationId,
        email: null, // URL発行による招待
        token: { not: null },
        expiresAt: { lt: new Date() } // 期限切れ
      }
    });

    const invitationUrls = await prisma.organizationInvitation.findMany({
      where: { 
        organizationId: params.organizationId,
        email: null, // メールアドレスがnullのもの（URL発行による招待）
        token: { not: null }
      },
      include: {
        inviter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invitationUrls);
  } catch (error) {
    console.error('Error in GET /api/organizations/[organizationId]/invitation-url:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// 招待URLの生成
export async function POST(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL is not set');
    }

    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isAdmin = await checkOrganizationAdmin(userId, params.organizationId);
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { role } = await req.json();
    if (!role) {
      return new NextResponse('ロールは必須です', { status: 400 });
    }

    // clerkIdからUserのidを取得
    const inviter = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!inviter) {
      return new NextResponse('ユーザーが見つかりません', { status: 404 });
    }

    // ユニークなトークンを生成
    const token = randomBytes(32).toString('hex');
    // 7日間の有効期限を設定
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 招待レコードを作成
    const invitation = await prisma.organizationInvitation.create({
      data: {
        email: null, // URL発行による招待なのでemailはnull
        role,
        organizationId: params.organizationId,
        invitedBy: inviter.id,
        token,
        expiresAt,
      },
      include: {
        inviter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    // 招待URLを生成
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/organization/${params.organizationId}/invitation/${invitation.id}/accept?token=${token}`;

    return NextResponse.json({ 
      invitation, 
      inviteUrl,
      expiresAt: invitation.expiresAt,
      expiresInDays: 7
    });
  } catch (error) {
    console.error('Error in POST /api/organizations/[organizationId]/invitation-url:', error);
    if (error instanceof Error) {
      if (error.message.includes('is not set')) {
        return new NextResponse('サーバーの設定が不完全です', { status: 500 });
      }
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 