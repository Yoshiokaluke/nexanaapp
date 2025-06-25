import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // OrganizationProfileからprofileImageを取得
    const organizationProfile = await prisma.organizationProfile.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId,
        },
      },
      select: {
        profileImage: true,
      },
    });

    if (!organizationProfile) {
      return new NextResponse('Profile not found', { status: 404 });
    }

    return NextResponse.json({
      profileImage: organizationProfile.profileImage,
    });
  } catch (error) {
    console.error('Error in GET /api/organizations/[organizationId]/members/[clerkId]/profile-image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 