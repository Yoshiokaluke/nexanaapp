import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScannerData() {
  try {
    // 組織を取得
    const organizations = await prisma.organization.findMany();
    console.log('組織一覧:', organizations);

    // QrScannerを取得
    const scanners = await prisma.qrScanner.findMany({
      include: {
        organization: true
      }
    });
    console.log('スキャナー一覧:', scanners);

    // ScanPurposeを取得
    const purposes = await prisma.scanPurpose.findMany({
      include: {
        organization: true
      }
    });
    console.log('スキャン目的一覧:', purposes);

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkScannerData(); 