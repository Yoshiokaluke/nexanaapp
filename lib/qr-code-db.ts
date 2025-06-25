import { prisma } from './prisma';
import { QrCodeManager, QrCodeData } from './qr-code';
import { QrCodeS3Manager } from './qr-code-s3';

export class QrCodeDatabaseManager {
  /**
   * OrganizationProfileのQRコードを取得または生成
   */
  static async getOrCreateQrCode(organizationProfileId: string) {
    try {
      console.log('QRコードDB操作開始:', { organizationProfileId });
      
      // トランザクション内で操作を実行
      const qrCode = await prisma.$transaction(async (tx) => {
        // まず既存のQRコードを確認
        const existingQrCode = await tx.organizationProfileQrCode.findUnique({
          where: { organizationProfileId },
          include: {
            organizationProfile: {
              include: {
                user: true,
                organization: true
              }
            }
          }
        });

        console.log('既存QRコード確認:', { 
          exists: !!existingQrCode, 
          isExpired: existingQrCode ? new Date() >= existingQrCode.expiresAt : null 
        });

        // 既存のQRコードが有効な場合は返す
        if (existingQrCode && new Date() < existingQrCode.expiresAt) {
          console.log('既存の有効なQRコードを返却:', { qrCodeId: existingQrCode.id });
          return existingQrCode;
        }

        console.log('新しいQRコードを生成開始');
        
        // 新しいQRコードを生成
        const qrCodeData = QrCodeManager.generateQrCodeData(organizationProfileId);
        console.log('QRコードデータ生成完了:', { 
          organizationProfileId: qrCodeData.organizationProfileId,
          expiresAt: new Date(qrCodeData.expiresAt)
        });
        
        // S3にQRコード画像をアップロード
        console.log('S3アップロード開始');
        const s3Key = await QrCodeS3Manager.uploadQrCodeImage(organizationProfileId, qrCodeData);
        console.log('S3アップロード完了:', { s3Key });

        // データベースに保存または更新
        console.log('データベース保存開始');
        
        if (existingQrCode) {
          // 既存レコードを更新
          console.log('既存レコードを更新');
          return await tx.organizationProfileQrCode.update({
            where: { organizationProfileId },
            data: {
              qrCodeData: JSON.stringify(qrCodeData),
              s3Key,
              expiresAt: new Date(qrCodeData.expiresAt),
              updatedAt: new Date()
            },
            include: {
              organizationProfile: {
                include: {
                  user: true,
                  organization: true
                }
              }
            }
          });
        } else {
          // 新規レコードを作成
          console.log('新規レコードを作成');
          return await tx.organizationProfileQrCode.create({
            data: {
              organizationProfileId,
              qrCodeData: JSON.stringify(qrCodeData),
              s3Key,
              expiresAt: new Date(qrCodeData.expiresAt)
            },
            include: {
              organizationProfile: {
                include: {
                  user: true,
                  organization: true
                }
              }
            }
          });
        }
      });

      console.log('QRコードDB保存完了:', { qrCodeId: qrCode.id });
      return qrCode;
      
    } catch (error) {
      console.error('QRコードDB操作エラー詳細:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        organizationProfileId
      });
      
      // ユニーク制約エラーの場合は、既存のレコードを取得して返す
      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        console.log('ユニーク制約エラー。既存レコードを取得します。');
        try {
          const existingQrCode = await prisma.organizationProfileQrCode.findUnique({
            where: { organizationProfileId },
            include: {
              organizationProfile: {
                include: {
                  user: true,
                  organization: true
                }
              }
            }
          });
          
          if (existingQrCode) {
            console.log('既存レコードを返却:', { qrCodeId: existingQrCode.id });
            return existingQrCode;
          }
        } catch (retryError) {
          console.error('既存レコード取得エラー:', retryError);
        }
      }
      
      throw error;
    }
  }

  /**
   * QRコード画像のURLを取得
   */
  static async getQrCodeImageUrl(organizationProfileId: string): Promise<string | null> {
    try {
      console.log('QRコードURL取得開始:', { organizationProfileId });
      
      const qrCode = await prisma.organizationProfileQrCode.findUnique({
        where: { organizationProfileId },
        select: { s3Key: true }
      });

      console.log('QRコードDB取得結果:', { 
        found: !!qrCode, 
        hasS3Key: !!qrCode?.s3Key 
      });

      if (!qrCode?.s3Key) {
        console.log('S3キーが見つかりません');
        return null;
      }

      const url = await QrCodeS3Manager.getQrCodeImageUrl(qrCode.s3Key);
      console.log('QRコードURL取得成功:', { urlLength: url.length });
      
      return url;
      
    } catch (error) {
      console.error('QRコードURL取得エラー詳細:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        organizationProfileId
      });
      throw error;
    }
  }

  /**
   * QRコードの使用履歴を記録
   */
  static async recordUsage(qrCodeId: string, scannerInfo?: {
    scannerId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await prisma.qrCodeUsageHistory.create({
      data: {
        qrCodeId,
        scannerId: scannerInfo?.scannerId,
        ipAddress: scannerInfo?.ipAddress,
        userAgent: scannerInfo?.userAgent
      }
    });
  }

  /**
   * QRコードデータを検証してOrganizationProfileを取得
   */
  static async validateAndGetProfile(qrDataString: string) {
    try {
      console.log('QRコードデータ解析開始:', { dataLength: qrDataString.length });
      const qrCodeData = QrCodeManager.parseQrCodeData(qrDataString);
      
      if (!qrCodeData) {
        console.log('QRコードデータ解析失敗');
        throw new Error('無効なQRコードデータです');
      }
      console.log('QRコードデータ解析成功:', { organizationProfileId: qrCodeData.organizationProfileId });

      if (QrCodeManager.isExpired(qrCodeData)) {
        console.log('QRコード期限切れ');
        throw new Error('QRコードの有効期限が切れています');
      }
      console.log('QRコード有効期限確認完了');

      console.log('プロファイル検索開始:', { organizationProfileId: qrCodeData.organizationProfileId });
      const profile = await prisma.organizationProfile.findUnique({
        where: { id: qrCodeData.organizationProfileId },
        include: {
          user: true,
          organization: true,
          organizationDepartment: true
        }
      });

      if (!profile) {
        console.log('プロファイル見つからず:', { organizationProfileId: qrCodeData.organizationProfileId });
        throw new Error('プロファイルが見つかりません');
      }
      console.log('プロファイル取得成功:', { profileId: profile.id, displayName: profile.displayName });

      return profile;
    } catch (error) {
      console.error('validateAndGetProfileエラー:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * 期限切れのQRコードを削除
   */
  static async cleanupExpiredQrCodes() {
    const now = new Date();
    
    const deletedCount = await prisma.organizationProfileQrCode.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });

    return deletedCount.count;
  }

  /**
   * ユーザーの全QRコードを取得
   */
  static async getUserQrCodes(clerkId: string) {
    return await prisma.organizationProfileQrCode.findMany({
      where: {
        organizationProfile: {
          clerkId
        }
      },
      include: {
        organizationProfile: {
          include: {
            organization: true,
            organizationDepartment: true
          }
        },
        usageHistory: {
          orderBy: {
            scannedAt: 'desc'
          },
          take: 10
        }
      }
    });
  }

  /**
   * 組織の全QRコードを取得
   */
  static async getOrganizationQrCodes(organizationId: string) {
    return await prisma.organizationProfileQrCode.findMany({
      where: {
        organizationProfile: {
          organizationId
        }
      },
      include: {
        organizationProfile: {
          include: {
            user: true,
            organizationDepartment: true
          }
        },
        usageHistory: {
          orderBy: {
            scannedAt: 'desc'
          },
          take: 5
        }
      }
    });
  }
} 