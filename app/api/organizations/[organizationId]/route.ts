import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { checkOrganizationMembership } from '@/lib/auth/roles';

// 組織詳細の取得
export async function GET(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 統一された権限チェック
    const hasAccess = await checkOrganizationMembership(clerkId, params.organizationId);
    if (!hasAccess) {
      return new NextResponse('この組織へのアクセス権限がありません', { status: 403 });
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: params.organizationId,
      },
          select: {
        id: true,
        name: true,
        address: true,
        managerName: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Error in GET /api/organizations/[organizationId]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 