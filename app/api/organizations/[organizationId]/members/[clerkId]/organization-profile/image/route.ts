import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { s3Client, deleteFromS3 } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ organizationId: string; clerkId: string }> }
) {
  const { organizationId, clerkId } = await params;
  
  console.log('=== 画像アップロード開始 ===');
  console.log('パラメータ:', { organizationId, clerkId });
  console.log('環境変数確認:', {
    hasS3Bucket: !!process.env.AWS_S3_BUCKET,
    hasRegion: !!process.env.AWS_REGION,
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
  });
  
  try {
    const { userId } = await auth();
    console.log('認証ユーザーID:', userId);
    
    if (!userId || userId !== clerkId) {
      console.log('認証エラー: userId !== clerkId');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('FormData解析開始');
    const formData = await req.formData();
    console.log('FormData解析完了');
    
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('ファイルが見つかりません');
      return new NextResponse('File is required', { status: 400 });
    }

    console.log('ファイル情報:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      console.log('ファイルサイズが大きすぎます');
      return new NextResponse('File size too large (max 5MB)', { status: 400 });
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      console.log('画像ファイルではありません');
      return new NextResponse('File must be an image', { status: 400 });
    }

    // S3にアップロード
    const fileKey = `profile-images/${organizationId}/${clerkId}/${Date.now()}-${file.name}`;
    console.log('ArrayBuffer変換開始');
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer変換完了');
    console.log('Buffer変換開始');
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer変換完了');

    console.log('S3アップロード開始:', { 
      fileKey, 
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      bufferSize: buffer.length
    });

    if (!process.env.AWS_S3_BUCKET) {
      throw new Error('AWS_S3_BUCKET environment variable is not set');
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    });

    console.log('S3コマンド実行前');
    await s3Client.send(command);
    console.log('S3アップロード完了');

    // S3のURLを生成
    const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    console.log('画像URL:', imageUrl);

    // データベースを更新
    console.log('データベース更新開始');
    const existingProfile = await prisma.organizationProfile.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId,
        },
      },
    });

    console.log('既存プロフィール確認:', existingProfile);

    let updatedProfile;
    if (existingProfile) {
      // 既存のプロフィールを更新
      console.log('既存プロフィールを更新');
      updatedProfile = await prisma.organizationProfile.update({
        where: {
          clerkId_organizationId: {
            clerkId,
            organizationId,
          },
        },
        data: {
          profileImage: imageUrl,
        },
        include: {
          organizationDepartment: true,
        },
      });
      console.log('プロフィール更新完了:', updatedProfile);
    } else {
      // 新しいプロフィールを作成（部署はnullに設定）
      console.log('新規プロフィールを作成');
      updatedProfile = await prisma.organizationProfile.create({
        data: {
          clerkId: clerkId,
          organizationId: organizationId,
          organizationDepartmentId: null, // 明示的にnullに設定
          profileImage: imageUrl,
        },
        include: {
          organizationDepartment: true,
        },
      });
      console.log('プロフィール作成完了:', updatedProfile);
    }

    console.log('更新後のプロフィール:', updatedProfile);
    console.log('=== 画像アップロード完了 ===');

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    console.error('エラー詳細:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // より詳細なエラー情報を返す
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ organizationId: string; clerkId: string }> }
) {
  const { organizationId, clerkId } = await params;
  try {
    console.log('=== 画像削除開始 ===');
    console.log('パラメータ:', { organizationId, clerkId });

    const { userId } = await auth();
    console.log('認証ユーザーID:', userId);
    
    if (!userId) {
      console.log('認証エラー: ユーザーIDがありません');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 既存のプロフィールを取得
    const existingProfile = await prisma.organizationProfile.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId: clerkId,
          organizationId: organizationId,
        },
      },
    });

    console.log('既存プロフィール:', existingProfile);

    // S3から画像を削除
    if (existingProfile?.profileImage) {
      try {
        console.log('S3から画像を削除中:', existingProfile.profileImage);
        await deleteFromS3(existingProfile.profileImage);
        console.log('S3画像削除完了');
      } catch (error) {
        console.error('S3画像削除エラー:', error);
        // 削除に失敗しても処理を続行
      }
    }

    // データベースを更新
    const updatedProfile = await prisma.organizationProfile.update({
      where: {
        clerkId_organizationId: {
          clerkId: clerkId,
          organizationId: organizationId,
        },
      },
      data: {
        profileImage: null,
      },
      include: {
        organizationDepartment: true,
      },
    });

    console.log('更新後のプロフィール:', updatedProfile);
    console.log('=== 画像削除完了 ===');

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('画像削除エラー:', error);
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
} 