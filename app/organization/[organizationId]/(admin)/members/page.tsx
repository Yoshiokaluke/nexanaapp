import { AdminMenu } from '@/components/organization/AdminMenu';
import MembersClient from './page.client';

export default async function MembersPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  return (
    <>
      <AdminMenu />
      <MembersClient organizationId={organizationId} />
    </>
  );
} 