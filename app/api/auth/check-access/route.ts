import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkOrganizationMembership } from '@/lib/auth/roles';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, targetClerkId } = await request.json();
    
    if (!organizationId) {
      return NextResponse.json({ error: '組織IDは必須です' }, { status: 400 });
    }

    // 組織情報を取得
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true }
    });

    if (!organization) {
      return NextResponse.json({ error: '組織が見つかりません' }, { status: 404 });
    }

    // 権限チェック: system_teamユーザーまたは組織メンバー（admin/member）
    const hasAccess = await checkOrganizationMembership(clerkId, organizationId);
    
    // system_teamユーザーは組織メンバーシップがなくてもアクセス可能
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { systemRole: true }
    });
    
    const isSystemTeam = user?.systemRole === 'system_team';
    
    if (!hasAccess && !isSystemTeam) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // 特定のユーザーのプロフィールにアクセスする場合の追加チェック
    if (targetClerkId && targetClerkId !== clerkId) {
      // 自分のプロフィール以外にアクセスする場合は、システムチームまたは組織のadmin権限が必要
    const membership = await prisma.organizationMembership.findFirst({
      where: {
            user: { clerkId },
        organizationId,
            role: 'admin'
          }
    });

    if (!membership) {
        return NextResponse.json({ error: '他のユーザーのプロフィールにアクセスする権限がありません' }, { status: 403 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      organizationName: organization.name 
    });
  } catch (error) {
    console.error('権限チェックエラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 