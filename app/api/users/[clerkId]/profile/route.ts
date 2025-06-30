import { auth, clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkOrganizationMembership } from "@/lib/auth/roles";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  const { clerkId } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // URLからorganizationIdを取得
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return new NextResponse('Organization ID is required', { status: 400 });
    }

    // checkOrganizationMembership関数を使用して権限チェック
    const hasAccess = await checkOrganizationMembership(userId, organizationId);
    
    if (!hasAccess) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in GET /api/users/[clerkId]/profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  const { clerkId } = await params;
  try {
    const { userId } = await auth();
    if (!userId || userId !== clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      gender,
      dateOfBirth,
      birthday,
      snsLinks,
      companyName,
      departmentName,
    } = body;

    // Clerkのユーザー情報を更新（氏名が提供されている場合）
    if (firstName !== undefined || lastName !== undefined) {
      await clerkClient.users.updateUser(userId, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
    }

    // トランザクションを使用して、UserとProfileの更新を同時に行う
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: {
          clerkId: userId,
        },
        data: {
          firstName,
          lastName,
          email,
        },
      });

      const profile = await tx.profile.upsert({
        where: {
          clerkId: userId,
        },
        create: {
          clerkId: userId,
          gender,
          birthday: dateOfBirth || birthday,
          snsLinks,
          companyName,
          departmentName,
        },
        update: {
          gender,
          birthday: dateOfBirth || birthday,
          snsLinks,
          companyName,
          departmentName,
        },
      });

      return { user, profile };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  const { clerkId } = await params;
  try {
    const { userId } = await auth();
    if (!userId || userId !== clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { birthday, gender, snsLinks, companyName, departmentName } = await req.json();

    const profile = await prisma.profile.upsert({
      where: { clerkId },
      update: {
        birthday,
        gender,
        snsLinks,
        companyName,
        departmentName,
      },
      create: {
        clerkId,
        birthday,
        gender,
        snsLinks,
        companyName,
        departmentName,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 