import { NextRequest, NextResponse } from 'next/server';
import { getScannerSessionFromCookie } from '@/lib/scanner/session';
import { QrCodeDatabaseManager } from '@/lib/qr-code-db';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // スキャナーセッションを確認
    const scannerSession = await getScannerSessionFromCookie();

    if (!scannerSession) {
      console.log('スキャナーセッションが見つかりません');
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { qrData, sessionId } = await request.json();

    console.log('受信データ:', { 
      qrData: qrData ? `${qrData.substring(0, 50)}...` : 'undefined',
      sessionId: sessionId || 'undefined',
      qrDataLength: qrData?.length || 0
    });

    if (!qrData || !sessionId) {
      console.log('リクエストデータが不足:', { 
        qrData: !!qrData, 
        sessionId: !!sessionId,
        qrDataType: typeof qrData,
        sessionIdType: typeof sessionId
      });
      return NextResponse.json(
        { error: 'QRデータとセッションIDが必要です' },
        { status: 400 }
      );
    }

    console.log('スキャン処理開始:', { 
      sessionId, 
      qrDataLength: qrData.length
    });

    // トランザクション内で一括処理
    console.log('トランザクション開始');
    const result = await prisma.$transaction(async (tx) => {
      console.log('セッション確認開始');
      // セッションの存在確認
      const scanSession = await tx.scanTogetherSession.findUnique({
        where: { id: sessionId }
      });

      if (!scanSession || scanSession.status !== 'active') {
        console.log('セッション無効:', { found: !!scanSession, status: scanSession?.status });
        throw new Error('無効なセッションです');
      }
      console.log('セッション確認完了');

      // QRコードからプロファイル情報を取得
      console.log('QRコード検証開始');
      const profile = await QrCodeDatabaseManager.validateAndGetProfile(qrData);
      console.log('QRコード検証完了:', { profileId: profile.id });

      // 組織IDの一致確認
      if (profile.organizationId !== scannerSession.organizationId) {
        console.log('組織ID不一致:', { profileOrg: profile.organizationId, scannerOrg: scannerSession.organizationId });
        throw new Error('組織が一致しません');
      }
      console.log('組織ID確認完了');

      // 既にスキャン済みかチェック
      console.log('重複チェック開始');
      const existingRecord = await tx.scanTogetherRecord.findFirst({
        where: {
          sessionId,
          organizationProfileId: profile.id
        }
      });

      if (existingRecord) {
        console.log('既にスキャン済み:', { recordId: existingRecord.id });
        return {
          success: false,
          message: '既にスキャン済みです',
          profile: {
            displayName: profile.displayName,
            user: profile.user
          }
        };
      }
      console.log('重複チェック完了');

      // スキャン記録を作成
      console.log('スキャン記録作成開始');
      const record = await tx.scanTogetherRecord.create({
        data: {
          sessionId,
          organizationProfileId: profile.id
        },
        include: {
          profile: {
            include: {
              user: true,
              organizationDepartment: true
            }
          }
        }
      });
      console.log('スキャン記録作成完了:', { recordId: record.id });

      return {
        success: true,
        message: 'スキャン成功',
        record: {
          id: record.id,
          scannedAt: record.scannedAt,
          profile: {
            displayName: record.profile.displayName,
            clerkId: record.profile.clerkId,
            user: record.profile.user,
            department: record.profile.organizationDepartment
          }
        }
      };
    }, {
      timeout: 10000, // 10秒のタイムアウト
      maxWait: 5000   // 最大5秒待機
    });
    console.log('トランザクション完了:', { success: result.success });

    // QRコード使用履歴の記録（非同期で実行、待機しない）
    if (result.success && result.record) {
      prisma.organizationProfileQrCode.findUnique({
        where: { organizationProfileId: result.record.profile.clerkId }
      }).then(qrCode => {
        if (qrCode) {
          return QrCodeDatabaseManager.recordUsage(qrCode.id, {
            scannerId: scannerSession.scannerId,
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
            userAgent: request.headers.get('user-agent') || undefined
          });
        }
      }).catch(error => {
        console.warn('QRコード使用履歴の記録に失敗:', error);
      });
    }

    console.log('スキャン処理完了');
    return NextResponse.json(result);

  } catch (error) {
    console.error('スキャンエラー:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: 'スキャン処理に失敗しました', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 