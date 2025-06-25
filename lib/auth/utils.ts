import { auth } from '@clerk/nextjs/server'
import { SystemRoleType, OrganizationRoleType, UserRole } from './roles'
import { AuthError, AuthErrorType } from './errors'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import { getAuthenticatedUser, checkOrganizationAdmin } from './roles'

export async function checkUserRole(userId: string, requiredRole?: UserRole): Promise<boolean> {
  if (!requiredRole) return true
  
  // TODO: DBからユーザーのロール情報を取得
  return true
}

export async function checkSystemTeamMember(userId: string): Promise<boolean> {
  // TODO: DBからシステムチームメンバーかどうかをチェック
  return true
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return userId
}

// 認証済みユーザーの情報を取得
export { getAuthenticatedUser, checkOrganizationAdmin }

// 組織のメンバーシップを取得
export async function getOrganizationMembership(userId: string, organizationId: string) {
  try {
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        clerkId: userId,
        organizationId
      }
    })

    return membership
  } catch (error) {
    console.error('Error getting organization membership:', error)
    return null
  }
}

// 認証エラーレスポンスを生成
export function createAuthErrorResponse(error: AuthErrorType) {
  return new Response(JSON.stringify({ error: error.message }), {
    status: error.code,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 認証ミドルウェアのヘルパー関数
export async function withAuth(handler: (userId: string) => Promise<Response>) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return createAuthErrorResponse(AuthError.UNAUTHORIZED)
    }

    return await handler(userId)
  } catch (error) {
    console.error('Auth middleware error:', error)
    return createAuthErrorResponse(AuthError.INTERNAL_ERROR)
  }
}

// システムチーム認証ミドルウェアのヘルパー関数
export async function withSystemTeamAuth(handler: (userId: string) => Promise<Response>) {
  return withAuth(async (userId) => {
    const isSystemTeam = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { systemRole: true }
    }).then((user: { systemRole: SystemRoleType | null } | null) => user?.systemRole === 'system_team')

    if (!isSystemTeam) {
      return createAuthErrorResponse(AuthError.FORBIDDEN)
    }

    return await handler(userId)
  })
}

// 組織管理者認証ミドルウェアのヘルパー関数
export async function withOrganizationAdminAuth(organizationId: string, handler: (userId: string) => Promise<Response>) {
  return withAuth(async (userId) => {
    const isSystemTeam = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { systemRole: true }
    }).then((user: { systemRole: SystemRoleType | null } | null) => user?.systemRole === 'system_team')

    if (isSystemTeam) {
      return await handler(userId)
    }

    const membership = await prisma.organizationMembership.findFirst({
      where: {
        clerkId: userId,
        organizationId,
        role: 'admin'
      }
    })

    if (!membership) {
      return createAuthErrorResponse(AuthError.FORBIDDEN)
    }

    return await handler(userId)
  })
}

// 組織メンバー一覧を取得
export async function getOrganizationMembers(organizationId: string) {
  try {
    const members = await prisma.organizationMembership.findMany({
      where: {
        organizationId
      },
      include: {
        user: {
          include: {
            organizationProfiles: {
              where: {
                organizationId
              },
              include: {
                organizationDepartment: true
              }
            },
            profile: true
          }
        }
      }
    })

    return members.map(membership => {
      const organizationProfile = membership.user.organizationProfiles[0];
      return {
        clerkId: membership.clerkId,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
        email: membership.user.email,
        profileImage: organizationProfile?.profileImage || null,
        displayName: organizationProfile?.displayName || null,
        introduction: organizationProfile?.introduction || null,
        organizationDepartment: organizationProfile?.organizationDepartment || null,
        updatedAt: organizationProfile?.updatedAt || membership.updatedAt
      }
    })
  } catch (error) {
    console.error('Error getting organization members:', error)
    return []
  }
}

// 組織プロフィールを取得
export async function getOrganizationProfile(clerkId: string, organizationId: string) {
  try {
    const profile = await prisma.organizationProfile.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId
        }
      },
      include: {
        organizationDepartment: true
      }
    })

    return profile
  } catch (error) {
    console.error('Error getting organization profile:', error)
    return null
  }
}

// ユーザープロフィールを取得
export async function getUserProfile(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        profile: true
      }
    })

    if (!user) return null

    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      birthday: user.profile?.birthday,
      gender: user.profile?.gender,
      snsLinks: user.profile?.snsLinks,
      companyName: user.profile?.companyName,
      departmentName: user.profile?.departmentName
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// 組織メンバーアクセス権限をチェック
export async function checkOrganizationMemberAccess(organizationId: string, clerkId: string) {
  try {
    // システムチームメンバーは全権限
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { systemRole: true }
    })

    if (user?.systemRole === 'system_team') {
      return true
    }

    // 同じorganizationIdのメンバーかチェック
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        clerkId,
        organizationId
      }
    })

    return !!membership
  } catch (error) {
    console.error('Error checking organization member access:', error)
    return false
  }
}

// 現在のユーザーを取得
export async function getCurrentUser() {
  try {
    const { userId } = await auth()
    if (!userId) return null

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        systemRole: true
      }
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// 例: /api/organizations/[organizationId]/departments/route.ts
export async function GET(req: NextRequest, { params }: { params: { organizationId: string } }) {
  const { organizationId } = params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  console.log('認証ユーザー:', user);
  console.log('組織ID:', organizationId);
  const isAdmin = await checkOrganizationAdmin(user.id, organizationId);
  console.log('isAdmin:', isAdmin);
  // ...
} 