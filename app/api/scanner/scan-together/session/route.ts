import { NextRequest, NextResponse } from 'next/server';
import { getScannerSessionFromCookie } from '@/lib/scanner/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // スキャナーセッションを確認
    const session = await getScannerSessionFromCookie();

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { purpose } = body;

    if (!purpose) {
      return NextResponse.json(
        { error: '目的IDが必要です' },
        { status: 400 }
      );
    }

    // 目的が存在し、有効かチェック
    const scanPurpose = await prisma.scanPurpose.findFirst({
      where: {
        id: purpose,
        organizationId: session.organizationId,
        isActive: true
      }
    });

    if (!scanPurpose) {
      return NextResponse.json(
        { error: '無効な目的です' },
        { status: 400 }
      );
    }

    // 新しいスキャンセッションを作成
    const scanSession = await prisma.scanTogetherSession.create({
      data: {
        scannerId: session.scannerId,
        organizationId: session.organizationId,
        purpose: scanPurpose.name,
        status: 'active'
      }
    });

    return NextResponse.json({
      success: true,
      sessionId: scanSession.id,
      purpose: scanPurpose.name
    });

  } catch (error) {
    console.error('セッション作成エラー:', error);
    return NextResponse.json(
      { error: 'セッション作成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getScannerSessionFromCookie();

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'セッションIDが必要です' },
        { status: 400 }
      );
    }

    // セッション情報とスキャン記録を取得
    const scanSession = await prisma.scanTogetherSession.findUnique({
      where: { id: sessionId },
      include: {
        records: {
          include: {
            profile: {
              include: {
                user: true,
                organizationDepartment: true
              }
            }
          },
          orderBy: { scannedAt: 'desc' }
        },
        getItemRecords: true
      }
    });

    if (!scanSession) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: scanSession
    });

  } catch (error) {
    console.error('セッション取得エラー:', error);
    return NextResponse.json(
      { error: 'セッション取得に失敗しました' },
      { status: 500 }
    );
  }
} 