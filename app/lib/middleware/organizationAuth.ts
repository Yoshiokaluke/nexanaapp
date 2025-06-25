import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkOrganizationRole, getAuthenticatedUser, type AuthenticatedUser } from '@/lib/auth/roles';

export async function organizationAuth(
  organizationId: string,
  requiredRole: 'admin' | 'member' = 'member'
): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return {
        user: null,
        error: new NextResponse('Unauthorized', { status: 401 })
      };
    }

    const hasAccess = await checkOrganizationRole(clerkUserId, organizationId, requiredRole);
    if (!hasAccess) {
      return {
        user: null,
        error: new NextResponse('Forbidden', { status: 403 })
      };
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        user: null,
        error: new NextResponse('User not found', { status: 404 })
      };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Error in organizationAuth:', error);
    return {
      user: null,
      error: new NextResponse('Internal Server Error', { status: 500 })
    };
  }
} 