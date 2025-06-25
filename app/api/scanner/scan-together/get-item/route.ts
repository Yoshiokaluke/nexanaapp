import { NextRequest, NextResponse } from 'next/server';
import { getScannerSessionFromCookie } from '@/lib/scanner/session';

export async function POST(request: NextRequest) {
  let prisma;
  
  try {
    // Prismaクライアントを確実に初期化
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    
    // スキャナーセッションを確認
    const scannerSession = await getScannerSessionFromCookie();

    if (!scannerSession) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'セッションIDが必要です' },
        { status: 400 }
      );
    }

    console.log('飲み物取得処理開始:', { sessionId, scannerId: scannerSession.scannerId });

    // セッションの存在確認
    const scanSession = await prisma.scanTogetherSession.findUnique({
      where: { id: sessionId },
      include: {
        records: {
          include: {
            profile: {
              select: {
                clerkId: true
              }
            }
          }
        }
      }
    });

    if (!scanSession) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      );
    }

    console.log('セッション情報:', { 
      status: scanSession.status, 
      recordCount: scanSession.records.length 
    });

    if (scanSession.status !== 'active') {
      return NextResponse.json(
        { error: 'セッションが既に完了しています' },
        { status: 400 }
      );
    }

    // ユニークユーザー数を計算（clerkIdでユニーク化）
    const uniqueUserIds = new Set(scanSession.records.map(record => record.profile.clerkId));
    const uniqueUserCount = uniqueUserIds.size;

    console.log('ユニークユーザー数:', { 
      totalRecords: scanSession.records.length, 
      uniqueUsers: uniqueUserCount 
    });

    // 2人以上のユニークユーザーがスキャンされているかチェック
    if (uniqueUserCount < 2) {
      return NextResponse.json(
        { error: '2人以上のユニークユーザーがスキャンする必要があります' },
        { status: 400 }
      );
    }

    // 既に飲み物取得記録があるかチェック
    const existingGetItemRecord = await prisma.getItemRecord.findFirst({
      where: { sessionId }
    });

    if (existingGetItemRecord) {
      return NextResponse.json(
        { error: '既に飲み物取得が記録されています' },
        { status: 400 }
      );
    }

    console.log('飲み物取得記録を作成中...');

    // 飲み物取得記録を作成
    const getItemRecord = await prisma.getItemRecord.create({
      data: {
        sessionId,
        claimedAt: new Date()
      }
    });

    console.log('飲み物取得記録作成完了:', getItemRecord.id);

    // セッションを完了状態に更新
    await prisma.scanTogetherSession.update({
      where: { id: sessionId },
      data: { status: 'completed' }
    });

    console.log('セッション完了状態に更新完了');

    return NextResponse.json({
      success: true,
      message: '飲み物取得が記録されました',
      getItemRecord: {
        id: getItemRecord.id,
        getItemAt: getItemRecord.claimedAt
      }
    });

  } catch (error) {
    console.error('飲み物取得記録エラー:', error);
    console.error('エラーの詳細:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: '飲み物取得の記録に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    // Prismaクライアントを確実に切断
    if (prisma) {
      await prisma.$disconnect();
    }
  }
} 