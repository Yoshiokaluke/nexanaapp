import { NextRequest, NextResponse } from 'next/server';
import { getScannerSessionFromCookie } from '@/lib/scanner/session';

export async function GET(request: NextRequest) {
  try {
    // スキャナーセッションを確認
    const session = await getScannerSessionFromCookie();

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 組織の有効なスキャン目的を取得
    const { prisma } = await import('@/lib/prisma');
    
    const scanPurposes = await prisma.scanPurpose.findMany({
      where: {
        organizationId: session.organizationId,
        isActive: true
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        order: true
      }
    });

    return NextResponse.json({
      success: true,
      purposes: scanPurposes
    });

  } catch (error) {
    console.error('スキャン目的取得エラー:', error);
    return NextResponse.json(
      { error: 'スキャン目的の取得に失敗しました' },
      { status: 500 }
    );
  }
} 