import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUsersByEmail() {
  const emailsToDelete = [
    'daiki.yoshioka16@gmail.com',
    'yoshiokaluke@gmail.com',
    'daiki.yoshioka@duotech.biz'
  ];

  console.log('指定されたメールアドレスのユーザーを削除します...');
  console.log('削除対象メールアドレス:', emailsToDelete);

  try {
    for (const email of emailsToDelete) {
      console.log(`\n${email} の削除を開始します...`);
      
      // ユーザーを検索
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          sentInvitations: true,
          memberships: true,
          organizationProfiles: {
            include: {
              qrCode: true
            }
          },
          profile: true,
          organizations: true
        }
      });

      if (!user) {
        console.log(`❌ ユーザーが見つかりません: ${email}`);
        continue;
      }

      console.log(`✅ ユーザーが見つかりました: ${user.firstName} ${user.lastName} (${user.clerkId})`);

      // 関連データの確認
      console.log(`- 送信した招待: ${user.sentInvitations.length}件`);
      console.log(`- 組織メンバーシップ: ${user.memberships.length}件`);
      console.log(`- 組織プロフィール: ${user.organizationProfiles.length}件`);
      console.log(`- プロフィール: ${user.profile ? 'あり' : 'なし'}`);
      console.log(`- 所属組織: ${user.organizations.length}件`);

      // 削除の確認
      const confirm = process.argv.includes('--confirm');
      if (!confirm) {
        console.log('⚠️  削除を実行するには --confirm フラグを追加してください');
        continue;
      }

      // 関連データを削除（外部キー制約のため順序が重要）
      
      // 1. 送信した招待を削除
      if (user.sentInvitations.length > 0) {
        await prisma.organizationInvitation.deleteMany({
          where: { invitedBy: user.id }
        });
        console.log(`✅ 送信した招待を削除しました`);
      }

      // 2. 組織メンバーシップを削除
      if (user.memberships.length > 0) {
        await prisma.organizationMembership.deleteMany({
          where: { clerkId: user.clerkId }
        });
        console.log(`✅ 組織メンバーシップを削除しました`);
      }

      // 3. QRコード使用履歴を削除（OrganizationProfileQrCodeを削除する前に）
      for (const orgProfile of user.organizationProfiles) {
        if (orgProfile.qrCode) {
          await prisma.qrCodeUsageHistory.deleteMany({
            where: { qrCodeId: orgProfile.qrCode.id }
          });
          console.log(`✅ QRコード使用履歴を削除しました (${orgProfile.organizationId})`);
        }
      }

      // 4. 組織プロフィールのQRコードを削除
      for (const orgProfile of user.organizationProfiles) {
        if (orgProfile.qrCode) {
          await prisma.organizationProfileQrCode.delete({
            where: { organizationProfileId: orgProfile.id }
          });
          console.log(`✅ 組織プロフィールQRコードを削除しました (${orgProfile.organizationId})`);
        }
      }

      // 5. 組織プロフィールを削除
      if (user.organizationProfiles.length > 0) {
        await prisma.organizationProfile.deleteMany({
          where: { clerkId: user.clerkId }
        });
        console.log(`✅ 組織プロフィールを削除しました`);
      }

      // 6. プロフィールを削除
      if (user.profile) {
        await prisma.profile.delete({
          where: { clerkId: user.clerkId }
        });
        console.log(`✅ プロフィールを削除しました`);
      }

      // 7. ユーザーを削除
      await prisma.user.delete({
        where: { email }
      });
      console.log(`✅ ユーザーを削除しました: ${email}`);
    }

    console.log('\n🎉 すべての削除処理が完了しました');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUsersByEmail(); 