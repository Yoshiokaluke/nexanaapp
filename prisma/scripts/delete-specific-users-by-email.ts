import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteSpecificUsersByEmail() {
  const emailsToDelete = [
    'yoshiokaluke@gmail.com',
    'daiki.yoshioka16@gmail.com',
    'test@example.com',
    'daiki.yoshioka@duotech.biz'
  ];

  try {
    console.log('=== 指定されたメールアドレスのユーザーを削除します ===');
    
    for (const email of emailsToDelete) {
      console.log(`\n--- ${email} の削除処理を開始 ---`);
      
      // ユーザーを検索
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: true,
          sentInvitations: true,
          organizationProfiles: {
            include: {
              qrCode: true
            }
          },
          profile: true
        }
      });

      if (!user) {
        console.log(`❌ ユーザーが見つかりません: ${email}`);
        continue;
      }

      console.log('ユーザー情報:', {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });

      console.log('関連データ:', {
        memberships: user.memberships.length,
        sentInvitations: user.sentInvitations.length,
        organizationProfiles: user.organizationProfiles.length,
        profile: user.profile ? 'あり' : 'なし'
      });

      // 関連データを削除
      console.log('関連データを削除中...');
      
      // Organization Profiles の QR Code 関連データを削除
      for (const orgProfile of user.organizationProfiles) {
        // QR Code の使用履歴を削除
        if (orgProfile.qrCode) {
          await prisma.qrCodeUsageHistory.deleteMany({
            where: { qrCodeId: orgProfile.qrCode.id }
          });
          console.log(`✅ QR Code 使用履歴を削除: ${orgProfile.organizationId}`);
          
          // QR Code を削除
          await prisma.organizationProfileQrCode.delete({
            where: { organizationProfileId: orgProfile.id }
          });
          console.log(`✅ QR Code を削除: ${orgProfile.organizationId}`);
        }
        
        // Scan Together Records を削除
        await prisma.scanTogetherRecord.deleteMany({
          where: { organizationProfileId: orgProfile.id }
        });
        console.log(`✅ Scan Together Records を削除: ${orgProfile.organizationId}`);
      }

      // Organization Profiles を削除
      if (user.organizationProfiles.length > 0) {
        await prisma.organizationProfile.deleteMany({
          where: { clerkId: user.clerkId }
        });
        console.log(`✅ Organization Profiles を削除: ${user.organizationProfiles.length}件`);
      }

      // Sent Invitations を削除
      if (user.sentInvitations.length > 0) {
        await prisma.organizationInvitation.deleteMany({
          where: { invitedBy: user.id }
        });
        console.log(`✅ Sent Invitations を削除: ${user.sentInvitations.length}件`);
      }

      // Memberships を削除
      if (user.memberships.length > 0) {
        await prisma.organizationMembership.deleteMany({
          where: { clerkId: user.clerkId }
        });
        console.log(`✅ Memberships を削除: ${user.memberships.length}件`);
      }

      // Profile を削除
      if (user.profile) {
        await prisma.profile.delete({
          where: { clerkId: user.clerkId }
        });
        console.log(`✅ Profile を削除`);
      }

      // ユーザーを削除
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log(`✅ ユーザーを削除: ${email}`);
    }

    console.log('\n=== 削除処理が完了しました ===');
  } catch (error) {
    console.error('削除処理中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSpecificUsersByEmail(); 