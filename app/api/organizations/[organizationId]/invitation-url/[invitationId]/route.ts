import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { checkOrganizationAdmin } from '@/lib/auth/roles';

// 招待URLの削除
export async function DELETE(
  req: Request,
  { params }: { params: { organizationId: string; invitationId: string } }
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

    // 招待の存在確認
    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        id: params.invitationId,
        organizationId: params.organizationId,
        email: null, // URL発行による招待のみ
        token: { not: null }
      }
    });

    if (!invitation) {
      return new NextResponse('招待URLが見つかりません', { status: 404 });
    }

    // 招待を削除
    await prisma.organizationInvitation.delete({
      where: { id: params.invitationId }
    });

    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[organizationId]/invitation-url/[invitationId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 