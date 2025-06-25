import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addScanPurposes() {
  try {
    // テスト組織を取得
    const organization = await prisma.organization.findFirst({
      where: { name: 'テスト組織' }
    });

    if (!organization) {
      console.log('テスト組織が見つかりません');
      return;
    }

    console.log('テスト組織ID:', organization.id);

    // 既存のスキャン目的を削除
    await prisma.scanPurpose.deleteMany({
      where: { organizationId: organization.id }
    });

    // 新しいスキャン目的を追加
    const purposes = [
      {
        name: '飲み会',
        description: '社内飲み会での参加者管理',
        order: 1,
        isActive: true
      },
      {
        name: 'イベント',
        description: '社内イベントでの参加者管理',
        order: 2,
        isActive: true
      },
      {
        name: '会議',
        description: '会議参加者の管理',
        order: 3,
        isActive: true
      }
    ];

    for (const purpose of purposes) {
      const created = await prisma.scanPurpose.create({
        data: {
          ...purpose,
          organizationId: organization.id
        }
      });
      console.log('スキャン目的を作成しました:', created);
    }

    console.log('すべてのスキャン目的を追加しました');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addScanPurposes(); 