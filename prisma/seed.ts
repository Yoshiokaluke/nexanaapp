import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // システム管理者ユーザーの作成
    const systemAdmin = await prisma.user.upsert({
      where: { email: 'daiki.yoshioka@nexanahq.com' },
      update: {},
      create: {
        email: 'daiki.yoshioka@nexanahq.com',
        clerkId: 'user_2wCBETc5XIIgyIXWsOqVu3cUyvu',
        firstName: '大輝',
        lastName: '吉岡',
        systemRole: 'system_team'
      },
    });

    console.log('システム管理者ユーザーを作成しました:', systemAdmin);

    // テスト組織の作成
    const testOrganization = await prisma.organization.create({
      data: {
        name: 'テスト組織',
        address: '東京都渋谷区',
        managerName: 'テストマネージャー',
      },
    });

    console.log('テスト組織を作成しました:', testOrganization);

    // テストユーザーの作成（必要な場合のみ）
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        clerkId: 'test_user',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    console.log('テストユーザーを作成しました:', testUser);

    // テストユーザーを組織のメンバーとして追加（必要な場合のみ）
    const membership = await prisma.organizationMembership.create({
      data: {
        organizationId: testOrganization.id,
        clerkId: testUser.clerkId,
        role: 'admin',
      },
    });

    console.log('組織メンバーシップを作成しました:', membership);
  } catch (error) {
    console.error('Error in seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 