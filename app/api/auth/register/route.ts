import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Register API: 開始');
    
    const { userId } = await auth();
    console.log('Register API: auth() 完了, userId:', userId);
    
    if (!userId) {
      console.log('Register API: 認証エラー - userId が null');
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Clerkからユーザー情報を取得
    console.log('Register API: currentUser() 開始');
    const user = await currentUser();
    console.log('Register API: currentUser() 完了, user:', user ? '存在' : 'null');
    
    if (!user) {
      console.log('Register API: ユーザーが見つかりません');
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    console.log('Clerk user data:', {
      userId,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName
    });

    // 既存のユーザーを確認
    console.log('Register API: 既存ユーザー確認開始');
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { systemRole: true }
    });

    console.log('Existing user:', existingUser);

    // ユーザーを作成または更新
    console.log('Register API: ユーザーupsert開始');
    const dbUser = await prisma.user.upsert({
      where: {
        clerkId: userId,
      },
      create: {
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress ?? '',
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        profile: {
          create: {},
        },
      },
      update: {
        email: user.emailAddresses[0]?.emailAddress ?? '',
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
      },
    });

    console.log('Synced user in database:', dbUser);

    // 組織メンバーシップも確認し、なければOrganizationProfileを作成
    const organizationId = user.publicMetadata.organizationId as string;
    if (organizationId) {
      await prisma.organizationProfile.upsert({
        where: {
          clerkId_organizationId: {
            clerkId: userId,
            organizationId: organizationId,
          },
        },
        create: {
          clerkId: userId,
          organizationId: organizationId,
        },
        update: {},
      });
    }

    console.log('Register API: 正常終了');
    return NextResponse.json({ success: true, user: dbUser });
  } catch (error) {
    console.error('Register API: エラー発生');
    console.error('Error in register:', error);
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Prismaエラーの場合は特別な処理
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', (error as any).code);
    }
    
    return NextResponse.json(
      { 
        error: '内部サーバーエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 