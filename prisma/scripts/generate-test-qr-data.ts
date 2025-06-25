import { prisma } from '../../lib/prisma';
import { QrCodeManager } from '../../lib/qr-code';

async function generateTestQRData() {
  try {
    console.log('テスト用QRコードデータ生成開始...');

    // 組織プロファイルを取得
    const profiles = await prisma.organizationProfile.findMany({
      include: {
        user: true,
        organization: true
      },
      take: 5 // 最初の5件を取得
    });

    if (profiles.length === 0) {
      console.log('組織プロファイルが見つかりません');
      return;
    }

    console.log(`${profiles.length}件のプロファイルが見つかりました`);

    // 各プロファイルのQRコードデータを生成
    for (const profile of profiles) {
      const qrCodeData = QrCodeManager.generateQrCodeData(profile.id);
      const qrDataString = JSON.stringify(qrCodeData);

      console.log('\n=== QRコードデータ ===');
      console.log(`プロファイルID: ${profile.id}`);
      console.log(`表示名: ${profile.displayName}`);
      console.log(`ユーザー: ${profile.user.firstName} ${profile.user.lastName}`);
      console.log(`組織: ${profile.organization.name}`);
      console.log(`QRデータ: ${qrDataString}`);
      console.log(`有効期限: ${new Date(qrCodeData.expiresAt).toLocaleString()}`);
      console.log('=====================\n');
    }

    console.log('テスト用QRコードデータ生成完了！');
    console.log('上記のQRデータをスキャナー画面のテスト入力欄に入力してテストしてください。');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトを実行
generateTestQRData(); 