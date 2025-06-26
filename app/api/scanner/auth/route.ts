import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createScannerSession, setScannerSessionCookie } from '@/lib/scanner/session';

export async function POST(request: NextRequest) {
  try {
    const { scannerId, password } = await request.json();

    if (!scannerId || !password) {
      return NextResponse.json(
        { error: 'スキャナーIDとパスワードが必要です' },
        { status: 400 }
      );
    }

    // QrScannerテーブルで認証
    const scanner = await prisma.qrScanner.findUnique({
      where: { scannerId },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!scanner) {
      return NextResponse.json(
        { error: 'スキャナーIDが存在しません' },
        { status: 401 }
      );
    }

    if (scanner.password !== password) {
      return NextResponse.json(
        { error: 'パスワードが正しくありません' },
        { status: 401 }
      );
    }

    if (scanner.status !== 'active') {
      return NextResponse.json(
        { error: 'このスキャナーは無効化されています' },
        { status: 403 }
      );
    }

    // 最終アクセス時刻を更新
    await prisma.qrScanner.update({
      where: { id: scanner.id },
      data: { lastActive: new Date() }
    });

    // セッショントークンを作成
    const token = await createScannerSession(scanner);

    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      message: '認証に成功しました',
      scanner: {
        id: scanner.id,
        name: scanner.name,
        organizationId: scanner.organizationId,
        organizationName: scanner.organization.name,
        location: scanner.location
      }
    });

    // クッキーを設定
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24時間
    };
    
    // 本番環境でのクッキー設定ログ
    if (process.env.NODE_ENV === 'production') {
      console.log('本番環境でのクッキー設定:', {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge
      });
    }

    response.cookies.set('scanner-session', token, cookieOptions);

    return response;

  } catch (error) {
    console.error('スキャナー認証エラー:', error);
    return NextResponse.json(
      { error: '認証処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // ログアウト処理
    const response = NextResponse.json({
      success: true,
      message: 'ログアウトしました'
    });

    // クッキーを削除（本番環境での設定を調整）
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    };
    
    // 本番環境ではドメインを明示的に設定しない
    if (process.env.NODE_ENV === 'production') {
      console.log('本番環境でのクッキー削除設定:', {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge
      });
    }

    response.cookies.set('scanner-session', '', cookieOptions);

    return response;
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return NextResponse.json(
      { error: 'ログアウト処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 