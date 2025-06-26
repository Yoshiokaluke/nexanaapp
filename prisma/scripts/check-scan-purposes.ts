import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScanPurposes() {
  try {
    console.log('=== スキャン目的データベース状態チェック ===');
    
    // 全組織を取得
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log('組織一覧:');
    organizations.forEach(org => {
      console.log(`- ${org.name} (ID: ${org.id})`);
    });
    
    // 各組織のスキャン目的を確認
    for (const org of organizations) {
      console.log(`\n=== ${org.name} のスキャン目的 ===`);
      
      const scanPurposes = await prisma.scanPurpose.findMany({
        where: {
          organizationId: org.id
        },
        orderBy: {
          order: 'asc'
        }
      });
      
      if (scanPurposes.length === 0) {
        console.log('❌ スキャン目的が設定されていません');
      } else {
        console.log(`✅ ${scanPurposes.length}件のスキャン目的があります:`);
        scanPurposes.forEach(purpose => {
          console.log(`  - ${purpose.name} (ID: ${purpose.id}, 有効: ${purpose.isActive}, 順序: ${purpose.order})`);
        });
      }
    }
    
    // スキャナー情報も確認
    console.log('\n=== スキャナー情報 ===');
    const scanners = await prisma.qrScanner.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (scanners.length === 0) {
      console.log('❌ スキャナーが登録されていません');
    } else {
      console.log(`✅ ${scanners.length}件のスキャナーがあります:`);
      scanners.forEach(scanner => {
        console.log(`  - ${scanner.name} (ID: ${scanner.scannerId}, 組織: ${scanner.organization.name})`);
      });
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkScanPurposes(); 