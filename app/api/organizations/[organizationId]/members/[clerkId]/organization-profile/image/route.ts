import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { uploadToS3, deleteFromS3 } from '@/lib/s3';

export async function POST(
  req: Request,
  { params }: { params: { organizationId: string; clerkId: string } }
) {
  try {
    console.log('=== 画像アップロード開始 ===');
    console.log('パラメータ:', { organizationId: params.organizationId, clerkId: params.clerkId });

    const { userId } = await auth();
    console.log('認証ユーザーID:', userId);
    
    if (!userId) {
      console.log('認証エラー: ユーザーIDがありません');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 環境変数の確認
    console.log('S3設定確認:', {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    });

    if (!process.env.AWS_S3_BUCKET) {
      console.error('S3_BUCKET環境変数が設定されていません');
      return new NextResponse('S3設定エラー: AWS_S3_BUCKETが設定されていません', { status: 500 });
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS認証情報が設定されていません');
      return new NextResponse('S3設定エラー: AWS認証情報が設定されていません', { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('ファイルが指定されていません');
      return new NextResponse('ファイルが指定されていません', { status: 400 });
    }

    console.log('ファイル情報:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // ファイルサイズのチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      console.log('ファイルサイズ超過:', file.size);
      return new NextResponse('ファイルサイズは5MB以下にしてください', { status: 400 });
    }

    // ファイルタイプのチェック
    if (!file.type.startsWith('image/')) {
      console.log('無効なファイルタイプ:', file.type);
      return new NextResponse('画像ファイルのみアップロード可能です', { status: 400 });
    }

    // 既存のプロフィールを確認
    const existingProfile = await prisma.organizationProfile.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId: params.clerkId,
          organizationId: params.organizationId,
        },
      },
    });

    console.log('既存プロフィール:', existingProfile);

    // 古い画像がある場合は削除
    if (existingProfile?.profileImage) {
      try {
        console.log('古い画像を削除中:', existingProfile.profileImage);
        await deleteFromS3(existingProfile.profileImage);
        console.log('古い画像削除完了');
      } catch (error) {
        console.error('古い画像削除エラー:', error);
        // 削除に失敗しても処理を続行
      }
    }

    // S3にアップロード
    console.log('S3にアップロード開始');
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `organizations/${params.organizationId}/members/${params.clerkId}/profile/${Date.now()}-${file.name}`;
    console.log('S3キー:', key);
    
    let url;
    try {
      url = await uploadToS3(buffer, key, file.type);
      console.log('S3アップロード完了:', url);
    } catch (s3Error) {
      console.error('S3アップロードエラー:', s3Error);
      return new NextResponse(`S3アップロードエラー: ${s3Error instanceof Error ? s3Error.message : 'Unknown S3 error'}`, { status: 500 });
    }

    let updatedProfile;
    try {
      if (existingProfile) {
        // 既存のプロフィールを更新
        console.log('既存プロフィールを更新');
        updatedProfile = await prisma.organizationProfile.update({
          where: {
            clerkId_organizationId: {
              clerkId: params.clerkId,
              organizationId: params.organizationId,
            },
          },
          data: {
            profileImage: url,
          },
          include: {
            organizationDepartment: true,
          },
        });
      } else {
        // デフォルトの部署を取得
        console.log('デフォルト部署を取得');
        const defaultDepartment = await prisma.organizationDepartment.findFirst({
          where: {
            organizationId: params.organizationId,
            isDefault: true,
          },
        });

        if (!defaultDepartment) {
          console.log('デフォルト部署が見つかりません');
          return new NextResponse('デフォルトの部署が見つかりません', { status: 404 });
        }

        // 新しいプロフィールを作成
        console.log('新規プロフィールを作成');
        updatedProfile = await prisma.organizationProfile.create({
          data: {
            clerkId: params.clerkId,
            organizationId: params.organizationId,
            organizationDepartmentId: defaultDepartment.id,
            profileImage: url,
          },
          include: {
            organizationDepartment: true,
          },
        });
      }
    } catch (dbError) {
      console.error('データベース更新エラー:', dbError);
      return new NextResponse(`データベース更新エラー: ${dbError instanceof Error ? dbError.message : 'Unknown DB error'}`, { status: 500 });
    }

    console.log('更新後のプロフィール:', updatedProfile);
    console.log('=== 画像アップロード完了 ===');
    console.log('レスポンスとして返すJSON:', JSON.stringify(updatedProfile, null, 2));

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    
    // エラーの詳細情報をログに出力
    if (error instanceof Error) {
      console.error('エラー詳細:');
      console.error('- メッセージ:', error.message);
      console.error('- 名前:', error.name);
      console.error('- スタック:', error.stack);
    }
    
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { organizationId: string; clerkId: string } }
) {
  try {
    console.log('=== 画像削除開始 ===');
    console.log('パラメータ:', { organizationId: params.organizationId, clerkId: params.clerkId });

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
          clerkId: params.clerkId,
          organizationId: params.organizationId,
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
          clerkId: params.clerkId,
          organizationId: params.organizationId,
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