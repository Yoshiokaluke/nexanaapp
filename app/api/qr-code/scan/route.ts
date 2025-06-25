import { NextRequest, NextResponse } from 'next/server';
import { QrCodeDatabaseManager } from '@/lib/qr-code-db';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrData, scannerInfo } = body;

    if (!qrData) {
      return NextResponse.json(
        { error: 'QRコードデータが必要です' },
        { status: 400 }
      );
    }

    // QRコードデータを検証してプロファイルを取得
    const profile = await QrCodeDatabaseManager.validateAndGetProfile(qrData);

    // QRコードIDを取得
    const qrCode = await prisma.organizationProfileQrCode.findUnique({
      where: { organizationProfileId: profile.id },
      select: { id: true }
    });

    // 使用履歴を記録
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (qrCode) {
      await QrCodeDatabaseManager.recordUsage(qrCode.id, {
        scannerId: scannerInfo?.scannerId,
        ipAddress: clientIp,
        userAgent
      });
    }

    // レスポンスデータを整形
    const responseData = {
      success: true,
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        introduction: profile.introduction,
        profileImage: profile.profileImage,
        user: {
          firstName: profile.user.firstName,
          lastName: profile.user.lastName,
          email: profile.user.email
        },
        organization: {
          id: profile.organization.id,
          name: profile.organization.name
        },
        department: profile.organizationDepartment ? {
          id: profile.organizationDepartment.id,
          name: profile.organizationDepartment.name
        } : null
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('QRコードスキャンエラー:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'QRコードの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 