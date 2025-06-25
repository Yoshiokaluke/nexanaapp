import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { QrCodeDatabaseManager } from '@/lib/qr-code-db';

// 進行中のリクエストを追跡するためのMap
const ongoingRequests = new Map<string, Promise<any>>();

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      console.error('QRコード生成API: 認証エラー - userIdが見つかりません');
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationProfileId } = body;

    if (!organizationProfileId) {
      console.error('QRコード生成API: パラメータエラー - organizationProfileIdが不足');
      return NextResponse.json(
        { error: 'OrganizationProfileIdが必要です' },
        { status: 400 }
      );
    }

    console.log('QRコード生成API: 開始', { userId, organizationProfileId });

    // 同じorganizationProfileIdの進行中のリクエストがある場合は、それを待つ
    const requestKey = `${userId}-${organizationProfileId}`;
    if (ongoingRequests.has(requestKey)) {
      console.log('進行中のリクエストを待機:', requestKey);
      const result = await ongoingRequests.get(requestKey);
      return NextResponse.json(result);
    }

    // 新しいリクエストを作成
    const requestPromise = (async () => {
      try {
        // 環境変数の確認
        console.log('環境変数確認:', {
          AWS_REGION: process.env.AWS_REGION,
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '設定済み' : '未設定',
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '設定済み' : '未設定',
          AWS_S3_BUCKET: process.env.AWS_S3_BUCKET
        });

        // QRコードを取得または生成
        const qrCode = await QrCodeDatabaseManager.getOrCreateQrCode(organizationProfileId);

        // S3からQRコード画像のURLを取得
        const qrCodeImageUrl = await QrCodeDatabaseManager.getQrCodeImageUrl(organizationProfileId);

        console.log('QRコード生成API: 成功', { qrCodeId: qrCode.id, hasImage: !!qrCodeImageUrl });

        return {
          success: true,
          qrCode: {
            id: qrCode.id,
            qrCodeImage: qrCodeImageUrl,
            expiresAt: qrCode.expiresAt,
            organizationProfile: {
              id: qrCode.organizationProfile.id,
              displayName: qrCode.organizationProfile.displayName,
              organization: {
                name: qrCode.organizationProfile.organization.name
              }
            }
          }
        };
      } catch (error) {
        console.error('QRコード生成エラー:', error);
        
        // エラーの詳細情報を出力
        if (error instanceof Error) {
          console.error('エラー詳細:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          
          return {
            error: error.message
          };
        }

        return {
          error: 'QRコードの生成中にエラーが発生しました'
        };
      }
    })();

    // リクエストをMapに保存
    ongoingRequests.set(requestKey, requestPromise);

    // リクエスト完了後にMapから削除
    requestPromise.finally(() => {
      ongoingRequests.delete(requestKey);
    });

    const result = await requestPromise;

    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('QRコード生成API: 予期しないエラー:', error);
    return NextResponse.json(
      { error: 'QRコードの生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 