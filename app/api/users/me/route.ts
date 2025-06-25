import { auth, clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // データベースからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        profile: true,
      },
    });

    // Clerkからもユーザー情報を取得
    const clerkUser = await clerkClient.users.getUser(userId);

    // データベースの情報を優先し、ない場合はClerkの情報を使用
    const userData = {
      id: user?.id,
      clerkId: userId,
      email: user?.email || clerkUser.emailAddresses[0]?.emailAddress,
      firstName: user?.firstName || clerkUser.firstName,
      lastName: user?.lastName || clerkUser.lastName,
      systemRole: user?.systemRole,
      profile: user?.profile,
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error in GET /api/users/me:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 