import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function addProductionScanPurposes() {
  try {
    console.log('=== 本番環境にスキャン目的を追加 ===');
    
    // 接続テスト
    await prisma.$connect();
    console.log('✅ データベース接続成功');
    
    // 全組織を取得
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`組織数: ${organizations.length}`);
    
    for (const org of organizations) {
      console.log(`\n=== ${org.name} の処理 ===`);
      
      // 既存のスキャン目的を確認
      const existingPurposes = await prisma.scanPurpose.findMany({
        where: { organizationId: org.id }
      });
      
      if (existingPurposes.length > 0) {
        console.log(`既に ${existingPurposes.length} 件のスキャン目的が存在します`);
        existingPurposes.forEach(purpose => {
          console.log(`  - ${purpose.name} (有効: ${purpose.isActive})`);
        });
        continue;
      }
      
      // デフォルトのスキャン目的を追加
      const defaultPurposes = [
        {
          name: '休憩',
          description: '休憩時間での参加者管理',
          order: 1,
          isActive: true
        },
        {
          name: '1on1',
          description: '1on1ミーティングでの参加者管理',
          order: 2,
          isActive: true
        },
        {
          name: '情報交換',
          description: '情報交換会での参加者管理',
          order: 3,
          isActive: true
        },
        {
          name: '仕事の会話',
          description: '仕事に関する会話での参加者管理',
          order: 4,
          isActive: true
        },
        {
          name: 'チームビルディング',
          description: 'チームビルディング活動での参加者管理',
          order: 5,
          isActive: true
        }
      ];
      
      console.log('デフォルトスキャン目的を追加中...');
      
      for (const purpose of defaultPurposes) {
        const created = await prisma.scanPurpose.create({
          data: {
            ...purpose,
            organizationId: org.id
          }
        });
        console.log(`✅ ${created.name} を追加しました`);
      }
      
      console.log(`✅ ${org.name} に ${defaultPurposes.length} 件のスキャン目的を追加しました`);
    }
    
    console.log('\n=== 完了 ===');
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addProductionScanPurposes(); 