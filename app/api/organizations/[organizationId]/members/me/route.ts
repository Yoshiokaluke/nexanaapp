import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const { organizationId } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 現在のユーザーの組織メンバーシップを取得
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId: userId,
          organizationId,
        },
      },
      include: {
        user: {
          include: {
            organizationProfiles: {
              where: {
                organizationId,
              },
              include: {
                organizationDepartment: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return new NextResponse('Membership not found', { status: 404 });
    }

    return NextResponse.json(membership);
  } catch (error) {
    console.error('Error in GET /api/organizations/[organizationId]/members/me:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 