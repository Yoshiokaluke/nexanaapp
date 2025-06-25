import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { checkOrganizationAdmin } from '@/lib/auth/roles';
import { Resend } from 'resend';
import { getUserRoles } from '@/lib/auth/roles';

const resend = new Resend(process.env.RESEND_API_KEY);

// メンバー一覧の取得
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

    const members = await prisma.organizationMembership.findMany({
      where: { 
        organizationId: params.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            systemRole: true,
          }
        }
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error in GET /api/organizations/[organizationId]/members:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// メンバー招待
export async function POST(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL is not set');
    }
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }

    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isAdmin = await checkOrganizationAdmin(userId, params.organizationId);
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { email, role } = await req.json();
    if (!email || !role) {
      return new NextResponse('必須項目が不足しています', { status: 400 });
    }

    // 既存の招待を確認
    const existingInvitation = await prisma.organizationInvitation.findUnique({
      where: {
        email_organizationId: {
          email,
          organizationId: params.organizationId
        }
      }
    });

    if (existingInvitation) {
      const message = existingInvitation.expiresAt > new Date()
        ? 'このメールアドレスは既に招待されています。招待は7日間有効です。'
        : 'このメールアドレスは既に招待されていますが、招待は期限切れです。新しい招待を送信します。';
      
      if (existingInvitation.expiresAt > new Date()) {
        return new NextResponse(message, { status: 400 });
      }
      
      // 期限切れの招待を削除
      await prisma.organizationInvitation.delete({
        where: {
          email_organizationId: {
            email,
            organizationId: params.organizationId
          }
        }
      });
    }

    // clerkIdからUserのidを取得
    const inviter = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!inviter) {
      return new NextResponse('ユーザーが見つかりません', { status: 404 });
    }

    // 招待レコードを作成
    const invitation = await prisma.organizationInvitation.create({
      data: {
        email,
        role,
        organizationId: params.organizationId,
        invitedBy: inviter.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
      }
    });

    // 招待URLを生成
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/organization/${params.organizationId}/invitation/${invitation.id}/accept`;
    
    console.log('Invitation details:', {
      invitationId: invitation.id,
      organizationId: params.organizationId,
      email,
      role,
      inviteUrl,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    });

    // 招待メールを送信
    const { data, error } = await resend.emails.send({
      from: 'AppNexana <no-reply@nexanahq.com>',
      to: email,
      subject: '組織への招待',
      html: `
        <h1>組織への招待</h1>
        <p>以下のリンクから組織に参加してください：</p>
        <p><strong>招待ID:</strong> ${invitation.id}</p>
        <p><strong>組織ID:</strong> ${params.organizationId}</p>
        <p><strong>ロール:</strong> ${role === 'admin' ? '管理者' : 'メンバー'}</p>
        <p><strong>有効期限:</strong> ${invitation.expiresAt.toLocaleString('ja-JP')}</p>
        <br>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">招待を受け入れる</a>
        <br><br>
        <p style="font-size: 12px; color: #666;">
          このリンクが機能しない場合は、以下のURLをブラウザにコピー&ペーストしてください：<br>
          ${inviteUrl}
        </p>
      `,
    });

    if (error) {
      console.error('Resend error details:', {
        error,
        email,
        organizationId: params.organizationId,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      });
      return new NextResponse(`招待メールの送信に失敗しました: ${error.message}`, { status: 500 });
    }

    return NextResponse.json({ invitation, emailResponse: data });
  } catch (error) {
    console.error('Invitation error details:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return new NextResponse('このメールアドレスは既に招待されています', { status: 400 });
      }
      if (error.message.includes('is not set')) {
        return new NextResponse('サーバーの設定が不完全です', { status: 500 });
      }
      // その他のエラーの場合、エラーメッセージを返す
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 