import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { organizationId: string; invitationId: string } }
) {
  try {
    console.log('Accept invitation request:', {
      organizationId: params.organizationId,
      invitationId: params.invitationId
    });

    const { userId } = await auth();
    if (!userId) {
      console.log('No user ID found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('User authenticated:', { userId });

    // ユーザー情報を取得
    console.log('Searching for user with clerkId:', userId);
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    console.log('User search result:', {
      found: !!user,
      userId,
      userDetails: user ? {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email
      } : null
    });

    // ユーザーが存在しない場合は、Clerkから情報を取得してユーザーを作成
    if (!user) {
      console.log('User not found in database, creating user from Clerk data');
      
      const clerkUser = await currentUser();
      if (!clerkUser) {
        console.log('Clerk user not found');
        return new NextResponse('ユーザー情報の取得に失敗しました。', { status: 400 });
      }

      console.log('Creating user from Clerk data:', {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName
      });

      try {
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
            firstName: clerkUser.firstName ?? null,
            lastName: clerkUser.lastName ?? null,
          },
      });
        console.log('User created successfully:', user);
      } catch (error) {
        console.error('Error creating user:', error);
        return new NextResponse('ユーザーの作成に失敗しました。', { status: 500 });
      }
    }

    console.log('User found/created:', { userId: user.clerkId, email: user.email });

    // URLからトークンを取得
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    console.log('Token from URL:', token);
    console.log('Full URL:', req.url);

    try {
      // すべての処理を1つのトランザクションで実行
      const result = await prisma.$transaction(async (tx) => {
        console.log('Starting transaction for invitation:', params.invitationId);
        
        // 招待の存在と有効期限を確認
        const invitation = await tx.organizationInvitation.findFirst({
          where: {
            id: params.invitationId,
            organizationId: params.organizationId,
          },
        });

        console.log('Invitation lookup result:', {
          found: !!invitation,
          invitationId: params.invitationId,
          organizationId: params.organizationId,
          hasToken: !!invitation?.token,
          providedToken: !!token,
          invitation: invitation ? {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            isExpired: invitation.expiresAt < new Date()
          } : null
        });

        if (!invitation) {
          throw new Error('招待が見つかりません。招待の有効期限が切れているか、既に使用されている可能性があります。');
        }

        // デフォルト部署の存在を確認
        const defaultDepartment = await tx.organizationDepartment.findFirst({
          where: {
            organizationId: params.organizationId,
            isDefault: true,
          }
        });

        if (!defaultDepartment) {
          throw new Error('組織にデフォルト部署が設定されていません。組織管理者に連絡してください。');
        }

        // トークンベースの招待の場合は、トークンを検証
        if (invitation.token && !token) {
          throw new Error('招待URLにトークンが含まれていません。正しい招待URLを使用してください。');
        }

        if (invitation.token && token && invitation.token !== token) {
          throw new Error('招待トークンが無効です。正しい招待URLを使用してください。');
        }

        // メール招待の場合は、メールアドレスの一致を確認
        if (invitation.email && invitation.email !== user.email) {
          throw new Error('招待されたメールアドレスと異なるアカウントでログインしています。');
        }

        if (invitation.expiresAt < new Date()) {
          console.log('Invitation expired, deleting:', params.invitationId);
          // 期限切れの招待を削除
          await tx.organizationInvitation.delete({
            where: { id: params.invitationId }
          });
          throw new Error('招待の有効期限が切れています。新しい招待をリクエストしてください。');
        }

        // 既存のメンバーシップを確認
        const existingMembership = await tx.organizationMembership.findUnique({
          where: {
            clerkId_organizationId: {
              clerkId: user.clerkId,
              organizationId: params.organizationId,
            },
          },
        });

        console.log('Existing membership check:', {
          found: !!existingMembership,
          clerkId: user.clerkId,
          organizationId: params.organizationId,
          membershipDetails: existingMembership ? {
            id: existingMembership.id,
            role: existingMembership.role,
            createdAt: existingMembership.createdAt
          } : null
        });

        if (existingMembership) {
          console.log('User already a member, deleting invitation');
          // 既存のメンバーシップがある場合は、招待を削除
          await tx.organizationInvitation.delete({
            where: { id: params.invitationId }
          });
          throw new Error('既にこの組織のメンバーです。招待は自動的に削除されました。');
        }

        console.log('Creating membership for user:', {
          clerkId: user.clerkId,
          organizationId: params.organizationId,
          role: invitation.role
        });

        // メンバーシップを作成
        await tx.organizationMembership.create({
          data: {
            clerkId: user.clerkId,
            organizationId: params.organizationId,
            role: invitation.role
          },
        });

        console.log('Membership created successfully');

        // 組織プロフィールを作成（または確認）
        await tx.organizationProfile.upsert({
          where: {
            clerkId_organizationId: {
              clerkId: user.clerkId,
              organizationId: params.organizationId,
            },
          },
          update: {},
          create: {
            clerkId: user.clerkId,
            organizationId: params.organizationId,
          },
        });

        console.log('OrganizationProfile created or confirmed');

        // 招待レコードは削除せずに残す（7日間の有効期限内で複数人使用可能）
        // 期限切れの場合は自動的に削除される
        console.log('Invitation kept for potential reuse within 7 days');

        return { success: true };
      });

      console.log('Transaction completed successfully');
      return new NextResponse('Success', { status: 200 });
    } catch (error) {
      console.error('Error in transaction:', error);
      if (error instanceof Error) {
        if (error.message.includes('Unique constraint')) {
          return new NextResponse('既にこの組織のメンバーです。', { status: 400 });
        }
        return new NextResponse(error.message, { status: 400 });
      }
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/organizations/[organizationId]/invitation/[invitationId]/accept:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 