import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import QRCode from 'qrcode';
import { QrCodeManager, QrCodeData } from './qr-code';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

console.log('QRコードS3設定:', {
  region: process.env.AWS_REGION,
  bucket: BUCKET_NAME,
  hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
});

export class QrCodeS3Manager {
  /**
   * QRコード画像をS3にアップロード
   */
  static async uploadQrCodeImage(organizationProfileId: string, qrCodeData: QrCodeData): Promise<string> {
    try {
      console.log('QRコードS3アップロード開始:', { organizationProfileId, bucket: BUCKET_NAME });
      
      // QRコード画像を生成
      const qrCodeImageBuffer = await QRCode.toBuffer(JSON.stringify(qrCodeData), {
        errorCorrectionLevel: 'M',
        type: 'png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log('QRコード画像生成完了:', { bufferSize: qrCodeImageBuffer.length });

      // S3のキーを生成
      const key = `qr-codes/${organizationProfileId}/${Date.now()}.png`;
      console.log('S3キー生成:', { key });

      // S3にアップロード
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: qrCodeImageBuffer,
        ContentType: 'image/png',
        Metadata: {
          'organization-profile-id': organizationProfileId,
          'expires-at': qrCodeData.expiresAt.toString()
        }
      });

      console.log('S3アップロードコマンド実行:', { bucket: BUCKET_NAME, key });
      await s3Client.send(uploadCommand);
      console.log('S3アップロード成功:', { key });

      return key;
    } catch (error) {
      console.error('QRコードS3アップロードエラー詳細:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        organizationProfileId,
        bucket: BUCKET_NAME
      });
      throw new Error('QRコードのアップロードに失敗しました');
    }
  }

  /**
   * S3からQRコード画像のURLを取得
   */
  static async getQrCodeImageUrl(s3Key: string): Promise<string> {
    try {
      console.log('QRコードURL取得開始:', { s3Key, bucket: BUCKET_NAME });
      
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      });

      // 署名付きURLを生成（1時間有効）
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log('QRコードURL取得成功:', { s3Key, urlLength: signedUrl.length });
      
      return signedUrl;
    } catch (error) {
      console.error('QRコードURL取得エラー詳細:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        s3Key,
        bucket: BUCKET_NAME
      });
      throw new Error('QRコード画像の取得に失敗しました');
    }
  }

  /**
   * 古いQRコード画像を削除
   */
  static async deleteOldQrCodeImages(organizationProfileId: string, keepCount: number = 1) {
    // この機能は必要に応じて実装
    // S3のライフサイクルポリシーで自動削除する方が効率的
  }
} 