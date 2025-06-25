import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from "next/navigation";

export type AuthenticatedUser = {
  id: string;
  clerkId: string;
  role: 'system_team' | 'user';
};

// 基本的な認証チェック
export async function requireAuth() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in?message=ログインが必要です");
  }
  
  return user;
}

// システムチーム権限チェック
export async function isSystemTeam(): Promise<boolean> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return false;

    const user = await prisma.user.findFirst({
      where: { clerkId: clerkUserId },
      select: { systemRole: true }
    });

    return user?.systemRole === 'system_team';
  } catch (error) {
    console.error('Error checking system team status:', error);
    return false;
  }
}

// 組織内での権限チェック
export const checkOrganizationRole = async (
  clerkUserId: string,
  organizationId: string,
  requiredRole: 'admin' | 'member'
): Promise<boolean> => {
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      user: { clerkId: clerkUserId },
      organizationId,
    },
    select: { role: true }
  });

  if (!membership) return false;
  if (requiredRole === 'member') return true;
  return membership.role === 'admin';
};

// ユーザー情報の取得
export async function getAuthenticatedUser(clerkUserId: string): Promise<AuthenticatedUser | null> {
  try {
    const user = await prisma.user.findFirst({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        clerkId: true,
        systemRole: true
      }
    });

    if (!user) return null;

    return {
      id: user.id,
      clerkId: user.clerkId,
      role: user.systemRole as 'system_team' | 'user'
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
} 