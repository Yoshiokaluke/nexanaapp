import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.update({
      where: {
        clerkId: userId,
      },
      data: {
        systemRole: 'system_team',
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in POST /api/users/set-system-role:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 