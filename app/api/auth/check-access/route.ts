import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkOrganizationMembership } from '@/lib/auth/roles';

export async function POST(request: NextRequest) {
  try {
    console.log('=== check-access API 開始 ===');
    
    const { userId: clerkId } = await auth();
    console.log('認証ユーザーID:', clerkId);
    
    if (!clerkId) {
      console.log('❌ 認証エラー: userIdが存在しません');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, targetClerkId } = await request.json();
    console.log('リクエストボディ:', { organizationId, targetClerkId });
    
    if (!organizationId) {
      console.log('❌ 組織IDが指定されていません');
      return NextResponse.json({ error: '組織IDは必須です' }, { status: 400 });
    }

    // 組織情報を取得
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true }
    });

    console.log('組織情報:', organization);

    if (!organization) {
      console.log('❌ 組織が見つかりません');
      return NextResponse.json({ error: '組織が見つかりません' }, { status: 404 });
    }

    // 権限チェック: system_teamユーザーまたは組織メンバー（admin/member）
    const hasAccess = await checkOrganizationMembership(clerkId, organizationId);
    console.log('組織メンバーシップ確認結果:', hasAccess);
    
    // system_teamユーザーは組織メンバーシップがなくてもアクセス可能
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { systemRole: true }
    });
    
    const isSystemTeam = user?.systemRole === 'system_team';
    console.log('システムチーム確認:', { systemRole: user?.systemRole, isSystemTeam });
    
    if (!hasAccess && !isSystemTeam) {
      console.log('❌ アクセス権限がありません');
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // 特定のユーザーのプロフィールにアクセスする場合の追加チェック
    if (targetClerkId && targetClerkId !== clerkId) {
      console.log('他のユーザーのプロフィールアクセスチェック');
      // 自分のプロフィール以外にアクセスする場合は、システムチームまたは組織のadmin権限が必要
    const membership = await prisma.organizationMembership.findFirst({
      where: {
            clerkId,
        organizationId,
            role: 'admin'
          }
    });

    console.log('管理者権限確認:', membership);

    if (!membership) {
        console.log('❌ 他のユーザーのプロフィールにアクセスする権限がありません');
        return NextResponse.json({ error: '他のユーザーのプロフィールにアクセスする権限がありません' }, { status: 403 });
      }
    }

    console.log('✅ アクセス権限確認完了');
    console.log('=== check-access API 完了 ===');
    
    return NextResponse.json({ 
      success: true, 
      organizationName: organization.name 
    });
  } catch (error) {
    console.error('権限チェックエラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 