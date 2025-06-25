import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

// スキャン目的一覧の取得
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーが組織のadmin権限またはsystem_team権限を持っているかチェック
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { systemRole: true }
    });

    // system_team権限の場合は全ての組織にアクセス可能
    if (user?.systemRole === 'system_team') {
      // スキャン目的一覧を取得
      const scanPurposes = await prisma.scanPurpose.findMany({
        where: {
          organizationId: params.organizationId
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return NextResponse.json(scanPurposes);
    }

    // 組織のadmin権限をチェック
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        clerkId: userId,
        organizationId: params.organizationId,
        role: 'admin'
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // スキャン目的一覧を取得
    const scanPurposes = await prisma.scanPurpose.findMany({
      where: {
        organizationId: params.organizationId
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(scanPurposes);
  } catch (error) {
    console.error('スキャン目的取得エラー:', error);
    return NextResponse.json(
      { error: 'スキャン目的の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// スキャン目的の作成
export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーが組織のadmin権限またはsystem_team権限を持っているかチェック
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { systemRole: true }
    });

    let hasAccess = false;

    // system_team権限の場合は全ての組織にアクセス可能
    if (user?.systemRole === 'system_team') {
      hasAccess = true;
    } else {
      // 組織のadmin権限をチェック
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          clerkId: userId,
          organizationId: params.organizationId,
          role: 'admin'
        }
      });
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: '目的名が必要です' },
        { status: 400 }
      );
    }

    // 同じ名前の目的が既に存在するかチェック
    const existingPurpose = await prisma.scanPurpose.findFirst({
      where: {
        organizationId: params.organizationId,
        name
      }
    });

    if (existingPurpose) {
      return NextResponse.json(
        { error: '同じ名前の目的が既に存在します' },
        { status: 400 }
      );
    }

    // スキャン目的を作成
    const scanPurpose = await prisma.scanPurpose.create({
      data: {
        organizationId: params.organizationId,
        name,
        description,
        order: order || 0,
        isActive: true
      }
    });

    return NextResponse.json(scanPurpose);
  } catch (error) {
    console.error('スキャン目的作成エラー:', error);
    return NextResponse.json(
      { error: 'スキャン目的の作成に失敗しました' },
      { status: 500 }
    );
  }
} 