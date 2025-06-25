import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

// スキャン目的の更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { organizationId: string; purposeId: string } }
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
    const { name, description, order, isActive } = body;

    // スキャン目的が存在するかチェック
    const existingPurpose = await prisma.scanPurpose.findFirst({
      where: {
        id: params.purposeId,
        organizationId: params.organizationId
      }
    });

    if (!existingPurpose) {
      return NextResponse.json(
        { error: 'スキャン目的が見つかりません' },
        { status: 404 }
      );
    }

    // 同じ名前の目的が既に存在するかチェック（自分以外）
    if (name && name !== existingPurpose.name) {
      const duplicatePurpose = await prisma.scanPurpose.findFirst({
        where: {
          organizationId: params.organizationId,
          name,
          id: { not: params.purposeId }
        }
      });

      if (duplicatePurpose) {
        return NextResponse.json(
          { error: '同じ名前の目的が既に存在します' },
          { status: 400 }
        );
      }
    }

    // スキャン目的を更新
    const updatedPurpose = await prisma.scanPurpose.update({
      where: { id: params.purposeId },
      data: {
        name,
        description,
        order,
        isActive
      }
    });

    return NextResponse.json(updatedPurpose);
  } catch (error) {
    console.error('スキャン目的更新エラー:', error);
    return NextResponse.json(
      { error: 'スキャン目的の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// スキャン目的の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; purposeId: string } }
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

    // スキャン目的が存在するかチェック
    const existingPurpose = await prisma.scanPurpose.findFirst({
      where: {
        id: params.purposeId,
        organizationId: params.organizationId
      }
    });

    if (!existingPurpose) {
      return NextResponse.json(
        { error: 'スキャン目的が見つかりません' },
        { status: 404 }
      );
    }

    // スキャン目的を削除
    await prisma.scanPurpose.delete({
      where: { id: params.purposeId }
    });

    return NextResponse.json({ message: 'スキャン目的を削除しました' });
  } catch (error) {
    console.error('スキャン目的削除エラー:', error);
    return NextResponse.json(
      { error: 'スキャン目的の削除に失敗しました' },
      { status: 500 }
    );
  }
} 