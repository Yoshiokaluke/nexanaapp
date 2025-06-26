import { NextRequest, NextResponse } from 'next/server';
import { getScannerSessionFromCookie } from '@/lib/scanner/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== スキャン目的取得API開始 ===');
    console.log('環境:', process.env.NODE_ENV);
    console.log('データベースURL:', process.env.DATABASE_URL ? '設定済み' : '未設定');
    
    // スキャナーセッションを確認
    const session = await getScannerSessionFromCookie();
    console.log('セッション情報:', session ? {
      scannerId: session.scannerId,
      organizationId: session.organizationId,
      scannerName: session.scannerName,
      organizationName: session.organizationName
    } : 'なし');

    if (!session) {
      console.log('❌ セッションが見つかりません');
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 組織の有効なスキャン目的を取得
    const { prisma } = await import('@/lib/prisma');
    
    console.log('組織IDでスキャン目的を検索中:', session.organizationId);
    
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

    console.log('取得したスキャン目的数:', scanPurposes.length);
    scanPurposes.forEach(purpose => {
      console.log(`- ${purpose.name} (ID: ${purpose.id}, 順序: ${purpose.order})`);
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