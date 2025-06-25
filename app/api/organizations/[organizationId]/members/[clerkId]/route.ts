import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { checkOrganizationAdmin } from '@/lib/auth/roles';

// メンバーの削除
export async function DELETE(
  req: Request,
  { params }: { params: { organizationId: string; clerkId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { organizationId, clerkId } = params;
    if (!organizationId || !clerkId) {
      return new NextResponse('組織IDとメンバーIDは必須です', { status: 400 });
    }

    // 統一された権限チェック
    const isAdmin = await checkOrganizationAdmin(clerkUserId, organizationId);
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 自分自身を削除しようとしている場合は拒否
    if (clerkId === clerkUserId) {
      return new NextResponse('Cannot remove yourself from the organization', { status: 400 });
    }

    // 削除対象のメンバーシップを取得
    const targetMembership = await prisma.organizationMembership.findFirst({
      where: { 
        user: { clerkId },
        organizationId
      },
      include: {
        user: true
      }
    });

    if (!targetMembership) {
      return new NextResponse('メンバーが見つかりません', { status: 404 });
    }

    // 組織の最後の管理者は削除できない
    if (targetMembership.role === 'admin') {
      const adminCount = await prisma.organizationMembership.count({
        where: {
          organizationId,
          role: 'admin'
        }
      });

      if (adminCount === 1) {
        return new NextResponse('組織の最後の管理者は削除できません', { status: 400 });
      }
    }

    // メンバーシップの削除
    await prisma.organizationMembership.delete({
      where: { id: targetMembership.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[organizationId]/members/[clerkId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// メンバー詳細の取得
export async function GET(
  req: Request,
  { params }: { params: { organizationId: string; clerkId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { organizationId, clerkId } = params;
    if (!organizationId || !clerkId) {
      return new NextResponse('組織IDとメンバーIDは必須です', { status: 400 });
    }

    // 統一された権限チェック
    const isAdmin = await checkOrganizationAdmin(clerkUserId, organizationId);
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const member = await prisma.organizationMembership.findFirst({
      where: {
        user: { clerkId },
        organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!member) {
      return new NextResponse('メンバーが見つかりません', { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error in GET /api/organizations/[organizationId]/members/[clerkId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// メンバーの権限変更
export async function PATCH(
  req: Request,
  { params }: { params: { organizationId: string; clerkId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { organizationId, clerkId } = params;
    if (!organizationId || !clerkId) {
      return new NextResponse('組織IDとメンバーIDは必須です', { status: 400 });
    }

    // 統一された権限チェック
    const isAdmin = await checkOrganizationAdmin(clerkUserId, organizationId);
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 自分自身の役割を変更しようとしている場合は拒否
    if (clerkId === clerkUserId) {
      return new NextResponse('Cannot change your own role', { status: 400 });
    }

    const { role } = await req.json();
    if (!role || !['admin', 'member'].includes(role)) {
      return new NextResponse('有効な権限を指定してください', { status: 400 });
    }

    const updatedMember = await prisma.organizationMembership.update({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId
        }
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[organizationId]/members/[clerkId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 