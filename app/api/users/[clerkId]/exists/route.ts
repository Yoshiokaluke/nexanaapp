import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { clerkId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (userId !== params.clerkId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // ユーザーの存在をチェック
    const user = await prisma.user.findUnique({
      where: { clerkId: params.clerkId },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({ exists: true });
  } catch (error) {
    console.error('Error in GET /api/users/[clerkId]/exists:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 