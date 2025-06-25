import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isSystemTeam } from '../auth';

export async function systemTeamAuth() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const hasSystemTeamAccess = await isSystemTeam();
    if (!hasSystemTeamAccess) {
      return NextResponse.json(
        { error: 'システムチームのみアクセス可能です' },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    console.error('System team auth error:', error);
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}