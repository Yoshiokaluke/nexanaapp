import { NextRequest, NextResponse } from 'next/server';
import { getScannerSessionFromCookie } from '@/lib/scanner/session';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== スキャナーセッションデバッグ ===');
    
    // クッキーの詳細を取得
    const cookieStore = await cookies();
    const scannerSessionCookie = cookieStore.get('scanner-session');
    
    console.log('クッキー詳細:', {
      name: scannerSessionCookie?.name,
      value: scannerSessionCookie?.value ? '存在' : 'なし',
      path: scannerSessionCookie?.path,
      domain: scannerSessionCookie?.domain,
      secure: scannerSessionCookie?.secure,
      httpOnly: scannerSessionCookie?.httpOnly,
      sameSite: scannerSessionCookie?.sameSite
    });
    
    // セッションを取得
    const session = await getScannerSessionFromCookie();
    
    console.log('セッション情報:', session ? {
      scannerId: session.scannerId,
      organizationId: session.organizationId,
      scannerName: session.scannerName,
      organizationName: session.organizationName,
      expiresAt: new Date(session.expiresAt).toISOString()
    } : 'なし');
    
    // データベースからスキャナー情報を取得
    const { prisma } = await import('@/lib/prisma');
    
    let scannerInfo = null;
    if (session) {
      scannerInfo = await prisma.qrScanner.findUnique({
        where: { scannerId: session.scannerId },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    }
    
    console.log('データベースのスキャナー情報:', scannerInfo ? {
      id: scannerInfo.id,
      scannerId: scannerInfo.scannerId,
      name: scannerInfo.name,
      organizationId: scannerInfo.organizationId,
      organizationName: scannerInfo.organization.name,
      status: scannerInfo.status
    } : 'なし');
    
    // スキャン目的を取得
    let scanPurposes = [];
    if (session) {
      scanPurposes = await prisma.scanPurpose.findMany({
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
    }
    
    console.log('スキャン目的数:', scanPurposes.length);
    
    return NextResponse.json({
      success: true,
      debug: {
        environment: process.env.NODE_ENV,
        cookie: {
          name: scannerSessionCookie?.name,
          exists: !!scannerSessionCookie?.value,
          path: scannerSessionCookie?.path,
          domain: scannerSessionCookie?.domain,
          secure: scannerSessionCookie?.secure,
          httpOnly: scannerSessionCookie?.httpOnly,
          sameSite: scannerSessionCookie?.sameSite
        },
        session: session ? {
          scannerId: session.scannerId,
          organizationId: session.organizationId,
          scannerName: session.scannerName,
          organizationName: session.organizationName,
          expiresAt: new Date(session.expiresAt).toISOString()
        } : null,
        scanner: scannerInfo ? {
          id: scannerInfo.id,
          scannerId: scannerInfo.scannerId,
          name: scannerInfo.name,
          organizationId: scannerInfo.organizationId,
          organizationName: scannerInfo.organization.name,
          status: scannerInfo.status
        } : null,
        scanPurposes: {
          count: scanPurposes.length,
          purposes: scanPurposes
        }
      }
    });
    
  } catch (error) {
    console.error('デバッグエラー:', error);
    return NextResponse.json(
      { error: 'デバッグ情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 