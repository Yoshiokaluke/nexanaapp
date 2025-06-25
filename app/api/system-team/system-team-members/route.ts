import { NextRequest, NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// リクエストボディのバリデーションスキーマ
const createMemberSchema = z.object({
  clerkId: z.string().min(1, 'Clerk IDは必須です'),
});

export async function GET() {
  try {
    const members = await prisma.user.findMany({
      where: {
        systemRole: 'system_team'
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        systemRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('システムチームメンバー一覧を取得しました');
    return NextResponse.json(members);
  } catch (error) {
    console.error('システムチームメンバーの取得に失敗しました:', error);
    return NextResponse.json(
      { error: AuthError.INTERNAL_ERROR.message },
      { status: AuthError.INTERNAL_ERROR.code }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validatedData = createMemberSchema.parse(json);

    const member = await prisma.user.update({
      where: { clerkId: validatedData.clerkId },
      data: {
        systemRole: 'system_team'
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        systemRole: true,
        createdAt: true,
      },
    });

    console.log(`システムチームメンバーを作成しました: ${member.clerkId}`);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('バリデーションエラー:', error.format());
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.format() },
        { status: 400 }
      );
    }

    console.error('システムチームメンバーの作成に失敗しました:', error);
    return NextResponse.json(
      { error: AuthError.INTERNAL_ERROR.message },
      { status: AuthError.INTERNAL_ERROR.code }
    );
  }
} 