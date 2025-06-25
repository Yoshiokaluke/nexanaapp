import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    console.log('Clerk userId:', userId);

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      // ユーザー情報を取得
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          email: true,
          memberships: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      console.log('Found user:', user);

      if (!user) {
        return new NextResponse('ユーザーが見つかりません', { status: 404 });
      }

      // 組織の一覧を返す
      const organizations = user.memberships.map((membership) => membership.organization);
      console.log('Returning organizations:', organizations);
      
      return NextResponse.json(organizations);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return new NextResponse('データベースエラーが発生しました', { status: 500 });
    }
  } catch (error) {
    console.error('Error in auth:', error);
    return new NextResponse('認証エラーが発生しました', { status: 500 });
  }
} 