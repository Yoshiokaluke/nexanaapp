import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfileImages() {
  const organizationId = 'cmcetny4n001itavaxvtjtec7';
  const clerkId = 'user_2z1jHimbW1ARRPcMktmovMCcnfT';

  console.log('=== OrganizationProfile 画像確認 ===');
  console.log(`組織ID: ${organizationId}`);
  console.log(`ユーザーID: ${clerkId}`);

  try {
    // 特定のユーザーのプロフィールを確認
    const profile = await prisma.organizationProfile.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId,
        },
      },
      include: {
        organizationDepartment: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (profile) {
      console.log('\n=== プロフィール情報 ===');
      console.log('ID:', profile.id);
      console.log('表示名:', profile.displayName);
      console.log('自己紹介:', profile.introduction);
      console.log('プロフィール画像:', profile.profileImage);
      console.log('部署:', profile.organizationDepartment?.name);
      console.log('ユーザー:', `${profile.user.firstName} ${profile.user.lastName} (${profile.user.email})`);
      console.log('作成日時:', profile.createdAt);
      console.log('更新日時:', profile.updatedAt);
    } else {
      console.log('❌ プロフィールが見つかりません');
    }

    // 組織内の全プロフィールを確認
    console.log('\n=== 組織内の全プロフィール ===');
    const allProfiles = await prisma.organizationProfile.findMany({
      where: { organizationId },
      include: {
        organizationDepartment: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`総プロフィール数: ${allProfiles.length}`);

    allProfiles.forEach((profile, index) => {
      console.log(`\nプロフィール ${index + 1}:`);
      console.log(`- ID: ${profile.id}`);
      console.log(`- ユーザー: ${profile.user.firstName} ${profile.user.lastName} (${profile.user.email})`);
      console.log(`- 表示名: ${profile.displayName || '未設定'}`);
      console.log(`- プロフィール画像: ${profile.profileImage || '未設定'}`);
      console.log(`- 部署: ${profile.organizationDepartment?.name || '未設定'}`);
      console.log(`- 更新日時: ${profile.updatedAt}`);
    });

    // 画像ありのプロフィール数を確認
    const profilesWithImage = allProfiles.filter(p => p.profileImage);
    const profilesWithoutImage = allProfiles.filter(p => !p.profileImage);

    console.log('\n=== 統計情報 ===');
    console.log(`画像あり: ${profilesWithImage.length}件`);
    console.log(`画像なし: ${profilesWithoutImage.length}件`);
    console.log(`画像設定率: ${((profilesWithImage.length / allProfiles.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfileImages(); 