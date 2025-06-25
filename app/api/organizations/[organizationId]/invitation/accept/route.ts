import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { organizationId } = params;
    if (!organizationId) {
      return new NextResponse('組織IDは必須です', { status: 400 });
    }

    const { invitationId } = await req.json();
    if (!invitationId) {
      return new NextResponse('招待IDは必須です', { status: 400 });
    }

    // 招待の検証
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      return new NextResponse('招待が見つかりません', { status: 404 });
    }

    if (invitation.expiresAt < new Date()) {
      // 期限切れの招待を削除
      await prisma.organizationInvitation.delete({
        where: { id: invitationId }
      });
      return new NextResponse('招待の有効期限が切れています', { status: 400 });
    }

    // ユーザー情報の取得
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    if (!user) {
      return new NextResponse('ユーザーが見つかりません', { status: 404 });
    }

    // メンバーシップの作成
    await prisma.organizationMembership.create({
      data: {
        clerkId: user.clerkId,
        organizationId: invitation.organizationId,
        role: invitation.role
      }
    });

    // 使用済みの招待を削除
    await prisma.organizationInvitation.delete({
      where: { id: invitationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/organizations/[organizationId]/invitation/accept:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 