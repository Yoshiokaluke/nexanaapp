import { getAuthenticatedUser, isOrganizationMember, checkOrganizationAdmin } from '@/lib/auth/roles';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

declare global {
  interface Window {
    __DISABLE_AUTHSYNC__?: boolean;
  }
}

export const dynamic = 'force-dynamic';

export default function NexanaTeamPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          NEXANA Team
        </h1>
        <p className="text-gray-600">
          Systemチーム専用ページ
        </p>
      </div>
    </div>
  );
}
