import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMemberDeletion() {
  const organizationId = 'cmccrh2vz0006tag8zo9agiem';
  const email = 'daiki.yoshioka16@gmail.com';

  console.log('=== メンバー削除前の状態確認 ===');
  
  // ユーザー情報を取得
  const user = await prisma.user.findFirst({
    where: { email }
  });

  if (!user) {
    console.log('ユーザーが見つかりません:', email);
    return;
  }

  console.log('ユーザー情報:', {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email
  });

  // メンバーシップを確認
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      clerkId: user.clerkId,
      organizationId
    }
  });

  console.log('メンバーシップ:', membership ? {
    id: membership.id,
    role: membership.role,
    createdAt: membership.createdAt
  } : 'なし');

  // 組織プロフィールを確認
  const profile = await prisma.organizationProfile.findFirst({
    where: {
      clerkId: user.clerkId,
      organizationId
    }
  });

  console.log('組織プロフィール:', profile ? {
    id: profile.id,
    displayName: profile.displayName,
    createdAt: profile.createdAt
  } : 'なし');

  console.log('\n=== メンバー削除処理のシミュレーション ===');
  
  if (membership) {
    console.log('メンバーシップを削除中...');
    await prisma.organizationMembership.delete({
      where: { id: membership.id }
    });
    console.log('メンバーシップ削除完了');
  }

  if (profile) {
    console.log('組織プロフィールと関連データを削除中...');
    
    // QRコードの使用履歴を削除
    await prisma.qrCodeUsageHistory.deleteMany({
      where: {
        qrCode: {
          organizationProfileId: profile.id
        }
      }
    });
    console.log('QRコード使用履歴削除完了');

    // QRコードを削除
    await prisma.organizationProfileQrCode.deleteMany({
      where: {
        organizationProfileId: profile.id
      }
    });
    console.log('QRコード削除完了');

    // スキャン記録を削除
    await prisma.scanTogetherRecord.deleteMany({
      where: {
        organizationProfileId: profile.id
      }
    });
    console.log('スキャン記録削除完了');

    // OrganizationProfileを削除
    await prisma.organizationProfile.delete({
      where: { id: profile.id }
    });
    console.log('組織プロフィール削除完了');
  }

  console.log('\n=== メンバー削除後の状態確認 ===');
  
  // 削除後のメンバーシップを確認
  const membershipAfter = await prisma.organizationMembership.findFirst({
    where: {
      clerkId: user.clerkId,
      organizationId
    }
  });

  console.log('メンバーシップ（削除後）:', membershipAfter ? '残存' : '削除済み');

  // 削除後の組織プロフィールを確認
  const profileAfter = await prisma.organizationProfile.findFirst({
    where: {
      clerkId: user.clerkId,
      organizationId
    }
  });

  console.log('組織プロフィール（削除後）:', profileAfter ? '残存' : '削除済み');

  console.log('\n=== 招待可能状態の確認 ===');
  
  // 再度招待可能かどうかを確認
  const canInvite = !membershipAfter && !profileAfter;
  console.log('再度招待可能:', canInvite ? 'はい' : 'いいえ');

  if (!canInvite) {
    console.log('理由:');
    if (membershipAfter) console.log('- メンバーシップが残存');
    if (profileAfter) console.log('- 組織プロフィールが残存');
  }
}

checkMemberDeletion()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 