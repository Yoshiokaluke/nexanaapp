import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { checkOrganizationAdmin } from '@/lib/auth/roles';
import InviteClient from './page.client';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized: No user found');
  }

  // 組織の管理者権限（システムチームメンバーを含む）をチェック
  await checkOrganizationAdmin(user.id, organizationId);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InviteClient organizationId={organizationId} />
    </Suspense>
  );
} 