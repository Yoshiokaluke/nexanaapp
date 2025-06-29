import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { checkOrganizationMembership } from '@/lib/auth/roles';

// 組織詳細の取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const { organizationId } = await params;
  try {
    console.log('組織情報取得リクエスト:', { organizationId });
    
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      console.log('認証されていません');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('認証済みユーザー:', { clerkId });

    // 統一された権限チェック
    const hasAccess = await checkOrganizationMembership(clerkId, organizationId);
    console.log('権限チェック結果:', { hasAccess });
    
    if (!hasAccess) {
      console.log('アクセス権限がありません');
      return new NextResponse('この組織へのアクセス権限がありません', { status: 403 });
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
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
      console.log('組織が見つかりません:', { organizationId });
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('組織情報取得成功:', { organizationId, name: organization.name });
    return NextResponse.json({ organization });
  } catch (error) {
    console.error('組織情報取得エラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 