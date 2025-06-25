import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { checkOrganizationMembership } from '@/lib/auth/roles';

// プロフィール取得
export async function GET(
  req: Request,
  { params }: { params: { organizationId: string; clerkId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { organizationId, clerkId } = params;

    // ユーザーがその組織のメンバーかどうかを確認
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId: userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // OrganizationProfileからプロフィール情報を取得
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

    if (!organizationProfile) {
      return new NextResponse('Profile not found', { status: 404 });
    }

    return NextResponse.json(organizationProfile);
  } catch (error) {
    console.error('Error in GET /api/organizations/[organizationId]/members/[clerkId]/organization-profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// プロフィール更新
export async function PATCH(
  req: Request,
  { params }: { params: { organizationId: string; clerkId: string } }
) {
  try {
    console.log('=== PATCH リクエスト開始 ===');
    console.log('パラメータ:', { organizationId: params.organizationId, clerkId: params.clerkId });

    const { userId } = await auth();
    console.log('認証ユーザーID:', userId);
    
    if (!userId || userId !== params.clerkId) {
      console.log('認証エラー: userId !== params.clerkId');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const requestBody = await req.json();
    console.log('リクエストボディ:', requestBody);

    const { introduction, displayName, organizationDepartmentId } = requestBody;
    console.log('抽出されたフィールド:', { introduction, displayName, organizationDepartmentId });

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

    let updatedProfile;
    if (existingProfile) {
      // 既存プロフィールを更新
      console.log('既存プロフィールを更新します');
      updatedProfile = await prisma.organizationProfile.update({
        where: {
          clerkId_organizationId: {
        clerkId: params.clerkId,
        organizationId: params.organizationId,
          },
        },
        data: {
          ...(introduction !== undefined && { introduction: introduction || null }),
          ...(displayName !== undefined && { displayName: displayName || null }),
          ...(organizationDepartmentId !== undefined && { organizationDepartmentId }),
        },
        include: {
          organizationDepartment: true,
        },
      });
    } else {
      // 新規プロフィールを作成
      console.log('新規プロフィールを作成します');
      
      // デフォルトの部署を取得
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

      updatedProfile = await prisma.organizationProfile.create({
        data: {
          clerkId: params.clerkId,
          organizationId: params.organizationId,
          organizationDepartmentId: organizationDepartmentId || defaultDepartment.id,
          introduction: introduction || null,
          displayName: displayName || null,
        },
        include: {
          organizationDepartment: true,
        },
      });
    }

    console.log('更新後のプロフィール:', updatedProfile);
    console.log('=== PATCH リクエスト完了 ===');

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[organizationId]/members/[clerkId]/organization-profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 