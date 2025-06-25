import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfileImages() {
  try {
    console.log('OrganizationProfileテーブルのprofileImageフィールドを確認中...\n');

    const profiles = await prisma.organizationProfile.findMany({
      select: {
        id: true,
        clerkId: true,
        organizationId: true,
        displayName: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`総プロフィール数: ${profiles.length}\n`);

    profiles.forEach((profile, index) => {
      console.log(`プロフィール ${index + 1}:`);
      console.log(`  ID: ${profile.id}`);
      console.log(`  Clerk ID: ${profile.clerkId}`);
      console.log(`  組織: ${profile.organization.name} (${profile.organizationId})`);
      console.log(`  ユーザー: ${profile.user.firstName} ${profile.user.lastName} (${profile.user.email})`);
      console.log(`  表示名: ${profile.displayName || '未設定'}`);
      console.log(`  プロフィール画像: ${profile.profileImage || '未設定'}`);
      console.log(`  作成日時: ${profile.createdAt}`);
      console.log(`  更新日時: ${profile.updatedAt}`);
      console.log('');
    });

    const profilesWithImage = profiles.filter(p => p.profileImage);
    const profilesWithoutImage = profiles.filter(p => !p.profileImage);

    console.log('統計情報:');
    console.log(`  画像あり: ${profilesWithImage.length}件`);
    console.log(`  画像なし: ${profilesWithoutImage.length}件`);
    console.log(`  画像設定率: ${((profilesWithImage.length / profiles.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfileImages(); 