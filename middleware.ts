import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SystemRoleType } from "@/lib/auth/roles";
import { scannerAuthMiddleware, isScannerRoute } from "@/lib/scanner/middleware";

// 公開ルートの定義
const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/organization-list",
  "/qr-scanner-login",
  "/scanner/login",
  "/api/webhooks/clerk",
  "/api/users/[userId]",
  "/api/organizations/[organizationId]/members/[userId]",
  "/api/test-env",
  "/api/organizations/[organizationId]/invitation/[invitationId]/accept"
];

// 無視するルートの定義
const ignoredRoutes = [
  "/qr-scanner",
  "/scanner",
  "/api/scanner",
  "/api/webhooks/clerk",
  "/_next/static",
  "/favicon.ico"
];

const userCache = new Map<string, { systemRole: SystemRoleType | null } | null>();

export const getUserWithCache = async (userId: string) => {
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { systemRole: true }
  });
  userCache.set(userId, user);
  return user;
};

const redirectToSignIn = (req: NextRequest) => {
  return NextResponse.redirect(new URL("/sign-in", req.url));
};

const redirectToOrganizationList = (req: NextRequest) => {
  return NextResponse.redirect(new URL("/organization-list", req.url));
};

const isSystemTeamRoute = (req: NextRequest) => {
  return req.nextUrl.pathname.startsWith("/system-team");
};

const isOrganizationRoute = (req: NextRequest) => {
  return req.nextUrl.pathname.startsWith("/organization");
};

const checkOrganizationAccess = async (userId: string | null, req: NextRequest) => {
  if (!userId) return false;
  
  const pathParts = req.nextUrl.pathname.split("/");
  const organizationId = pathParts[2];
  
  if (!organizationId) return false;

  try {
    // 1. 最優先: システムチーム権限をチェック
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { systemRole: true }
    });

    if (user?.systemRole === 'system_team') {
      return true;
    }

    // 2. 次に: 組織メンバーシップをチェック
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
        role: { in: ['admin', 'member'] }
      }
    });
    
    return !!membership;
  } catch (error) {
    console.error('組織アクセスチェックエラー:', error);
    return false;
  }
};

export default authMiddleware({
  publicRoutes: [
    "/", 
    "/sign-in", 
    "/sign-up", 
    "/organization-list", 
    "/scanner/login",
    "/api/scanner/auth",
    "/api/scanner/auth/check",
    "/api/test-env",
    "/organization/[organizationId]/invitation/[invitationId]/accept",
    "/api/organizations/[organizationId]/invitation/[invitationId]/accept"
  ],
  beforeAuth: async (req) => {
    if (isScannerRoute(req.nextUrl.pathname)) {
      return await scannerAuthMiddleware(req);
    }
    
    return NextResponse.next();
  },
  afterAuth: async (auth, req) => {
    if (isScannerRoute(req.nextUrl.pathname)) {
      return NextResponse.next();
    }

    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

export const checkSystemTeamAccess = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { systemRole: true }
  });
  return user?.systemRole === 'system_team';
}; 
