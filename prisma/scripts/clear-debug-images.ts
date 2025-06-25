import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDebugImages() {
  try {
    console.log('デバッグ用画像URLをクリア中...\n');

    // デバッグ用URLを含むプロフィールを検索
    const profilesWithDebugImages = await prisma.organizationProfile.findMany({
      where: {
        profileImage: {
          contains: 'debug-s3-upload'
        }
      },
      select: {
        id: true,
        clerkId: true,
        profileImage: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`デバッグ用画像を持つプロフィール数: ${profilesWithDebugImages.length}\n`);

    if (profilesWithDebugImages.length === 0) {
      console.log('クリアするデバッグ用画像はありません');
      return;
    }

    // デバッグ用URLをnullに更新
    const updateResult = await prisma.organizationProfile.updateMany({
      where: {
        profileImage: {
          contains: 'debug-s3-upload'
        }
      },
      data: {
        profileImage: null
      }
    });

    console.log(`更新されたプロフィール数: ${updateResult.count}`);
    console.log('デバッグ用画像URLのクリアが完了しました');

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDebugImages(); 