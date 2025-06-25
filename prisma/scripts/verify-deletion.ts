import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDeletion() {
  const emailsToCheck = [
    'daiki.yoshioka16@gmail.com',
    'yoshiokaluke@gmail.com',
    'daiki.yoshioka@duotech.biz'
  ];

  console.log('削除確認を開始します...');
  console.log('確認対象メールアドレス:', emailsToCheck);

  try {
    for (const email of emailsToCheck) {
      console.log(`\n${email} の確認中...`);
      
      // ユーザーを検索
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: true,
          organizationProfiles: true,
          profile: true,
          sentInvitations: true,
          organizations: true
        }
      });

      if (!user) {
        console.log(`${email}: ✅ 正常に削除されています`);
      } else {
        console.log(`${email}: ❌ まだ存在しています`);
        console.log(`- ID: ${user.id}`);
        console.log(`- Clerk ID: ${user.clerkId}`);
        console.log(`- 名前: ${user.firstName} ${user.lastName}`);
        console.log(`- 組織メンバーシップ: ${user.memberships.length}件`);
        console.log(`- 組織プロフィール: ${user.organizationProfiles.length}件`);
        console.log(`- プロフィール: ${user.profile ? '存在' : 'なし'}`);
        console.log(`- 送信した招待: ${user.sentInvitations.length}件`);
        console.log(`- 管理組織: ${user.organizations.length}件`);
      }
    }

    console.log('\n削除確認が完了しました');

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDeletion(); 