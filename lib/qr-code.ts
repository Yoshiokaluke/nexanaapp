import QRCode from 'qrcode';

export interface QrCodeData {
  organizationProfileId: string;
  timestamp: number;
  expiresAt: number;
}

export class QrCodeManager {
  private static readonly VALIDITY_MINUTES = 5;

  /**
   * QRコードデータを生成
   */
  static generateQrCodeData(organizationProfileId: string): QrCodeData {
    const now = Date.now();
    const expiresAt = now + (this.VALIDITY_MINUTES * 60 * 1000);

    return {
      organizationProfileId,
      timestamp: now,
      expiresAt
    };
  }

  /**
   * QRコード画像を生成
   */
  static async generateQrCodeImage(data: QrCodeData): Promise<string> {
    const qrData = JSON.stringify(data);
    
    try {
      const qrCodeImage = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeImage;
    } catch (error) {
      console.error('QRコード生成エラー:', error);
      throw new Error('QRコードの生成に失敗しました');
    }
  }

  /**
   * QRコードデータを検証
   */
  static validateQrCodeData(data: QrCodeData): boolean {
    const now = Date.now();
    return now <= data.expiresAt;
  }

  /**
   * QRコードデータを文字列から解析
   */
  static parseQrCodeData(qrDataString: string): QrCodeData | null {
    try {
      const data = JSON.parse(qrDataString) as QrCodeData;
      
      // 必要なフィールドが存在するかチェック
      if (!data.organizationProfileId || !data.timestamp || !data.expiresAt) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('QRコードデータの解析エラー:', error);
      return null;
    }
  }

  /**
   * 有効期限をチェック
   */
  static isExpired(data: QrCodeData): boolean {
    return Date.now() > data.expiresAt;
  }

  /**
   * 残り時間を取得（秒）
   */
  static getRemainingTime(data: QrCodeData): number {
    const remaining = data.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }
} 