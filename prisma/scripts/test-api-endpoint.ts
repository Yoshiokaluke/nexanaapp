import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApiEndpoint() {
  const organizationId = 'cmcetny4n001itavaxvtjtec7';
  const clerkId = 'user_2z5nC8IwXNjOSffwQsLqscCACtj';

  console.log('=== APIエンドポイントテスト ===');
  console.log(`組織ID: ${organizationId}`);
  console.log(`ユーザーID: ${clerkId}`);

  try {
    // 1. メンバーシップの確認
    console.log('\n=== メンバーシップ確認 ===');
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId,
        },
      },
    });

    if (membership) {
      console.log('✅ メンバーシップが見つかりました:', {
        id: membership.id,
        role: membership.role,
        clerkId: membership.clerkId,
        organizationId: membership.organizationId
      });
    } else {
      console.log('❌ メンバーシップが見つかりません');
      return;
    }

    // 2. 組織プロフィールの確認
    console.log('\n=== 組織プロフィール確認 ===');
    const organizationProfile = await prisma.organizationProfile.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId,
        },
      },
      include: {
        organizationDepartment: true,
      },
    });

    if (organizationProfile) {
      console.log('✅ 組織プロフィールが見つかりました:', {
        id: organizationProfile.id,
        displayName: organizationProfile.displayName,
        introduction: organizationProfile.introduction,
        profileImage: organizationProfile.profileImage,
        department: organizationProfile.organizationDepartment?.name,
        clerkId: organizationProfile.clerkId,
        organizationId: organizationProfile.organizationId
      });
    } else {
      console.log('❌ 組織プロフィールが見つかりません');
    }

    // 3. ユーザーの確認
    console.log('\n=== ユーザー確認 ===');
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (user) {
      console.log('✅ ユーザーが見つかりました:', {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } else {
      console.log('❌ ユーザーが見つかりません');
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiEndpoint(); 