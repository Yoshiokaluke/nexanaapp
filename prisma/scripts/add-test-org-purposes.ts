import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestOrgPurposes() {
  try {
    // TEST組織を取得
    const organization = await prisma.organization.findFirst({
      where: { name: 'TEST' }
    });

    if (!organization) {
      console.log('TEST組織が見つかりません');
      return;
    }

    console.log('TEST組織ID:', organization.id);

    // 既存のスキャン目的を削除
    await prisma.scanPurpose.deleteMany({
      where: { organizationId: organization.id }
    });

    // 新しいスキャン目的を追加
    const purposes = [
      {
        name: 'テスト飲み会',
        description: 'テスト用の飲み会参加者管理',
        order: 1,
        isActive: true
      },
      {
        name: 'テストイベント',
        description: 'テスト用のイベント参加者管理',
        order: 2,
        isActive: true
      },
      {
        name: 'テスト会議',
        description: 'テスト用の会議参加者管理',
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

    console.log('TEST組織のスキャン目的を追加しました');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestOrgPurposes(); 