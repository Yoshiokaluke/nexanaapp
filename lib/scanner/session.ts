import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'scanner-secret-key-2024'
);

export interface ScannerSession {
  scannerId: string;
  organizationId: string;
  scannerName: string;
  organizationName: string;
  expiresAt: number;
  [key: string]: any; // インデックスシグネチャを追加
}

export async function createScannerSession(scanner: any): Promise<string> {
  const session: ScannerSession = {
    scannerId: scanner.scannerId,
    organizationId: scanner.organizationId,
    scannerName: scanner.name,
    organizationName: scanner.organization.name,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24時間
  };

  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(SECRET_KEY);

  return token;
}

export async function verifyScannerSession(token: string): Promise<ScannerSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as ScannerSession;
  } catch (error) {
    console.error('セッション検証エラー:', error);
    return null;
  }
}

export async function getScannerSessionFromRequest(request: NextRequest): Promise<ScannerSession | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    return await verifyScannerSession(token);
  } catch (error) {
    console.error('リクエストからのセッション取得エラー:', error);
    return null;
  }
}

export async function getScannerSessionFromCookie(): Promise<ScannerSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('scanner-session')?.value;
    
    console.log('クッキーから取得したトークン:', token ? '存在' : 'なし');
    
    if (!token) {
      return null;
    }

    const session = await verifyScannerSession(token);
    console.log('検証されたセッション:', session ? '成功' : '失敗');
    
    return session;
  } catch (error) {
    console.error('クッキーからのセッション取得エラー:', error);
    return null;
  }
}

export async function setScannerSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('scanner-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 // 24時間
  });
}

export async function clearScannerSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('scanner-session');
} 