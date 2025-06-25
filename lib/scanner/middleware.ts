import { NextRequest, NextResponse } from 'next/server';
import { getScannerSessionFromCookie } from './session';

export async function scannerAuthMiddleware(request: NextRequest) {
  // ログインページは除外
  if (request.nextUrl.pathname === '/scanner/login') {
    return NextResponse.next();
  }

  // スキャナーセッションをチェック
  const session = await getScannerSessionFromCookie();

  if (!session) {
    // セッションが無効な場合はログインページにリダイレクト
    return NextResponse.redirect(new URL('/scanner/login', request.url));
  }

  // セッションが有効期限切れかチェック
  if (session.expiresAt < Date.now()) {
    // セッション期限切れの場合はログインページにリダイレクト
    return NextResponse.redirect(new URL('/scanner/login', request.url));
  }

  // セッションが有効な場合は次の処理に進む
  return NextResponse.next();
}

export function isScannerRoute(pathname: string): boolean {
  return pathname.startsWith('/scanner');
} 