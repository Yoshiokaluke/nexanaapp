import { NextRequest, NextResponse } from 'next/server';
import { getScannerSessionFromCookie } from '@/lib/scanner/session';

export async function GET(request: NextRequest) {
  try {
    console.log('セッション確認API開始');
    
    // クッキーからセッション情報を取得
    const session = await getScannerSessionFromCookie();
    
    console.log('セッション情報:', session);

    if (!session) {
      console.log('セッションが見つかりません');
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 401 }
      );
    }

    // セッションが有効期限切れかチェック
    if (session.expiresAt < Date.now()) {
      console.log('セッションが期限切れ:', { expiresAt: session.expiresAt, now: Date.now() });
      return NextResponse.json(
        { error: 'セッションが期限切れです' },
        { status: 401 }
      );
    }

    console.log('セッション確認成功');

    return NextResponse.json({
      success: true,
      scanner: {
        name: session.scannerName,
        organizationName: session.organizationName,
        scannerId: session.scannerId,
        organizationId: session.organizationId
      }
    });

  } catch (error) {
    console.error('セッション確認エラー:', error);
    return NextResponse.json(
      { error: 'セッション確認中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 