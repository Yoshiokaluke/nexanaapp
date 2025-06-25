import { AdminMenu } from '@/components/organization/AdminMenu';
import MembersClient from './page.client';

export default function MembersPage({ params }: { params: { organizationId: string } }) {
  return (
    <>
      <AdminMenu />
      <MembersClient organizationId={params.organizationId} />
    </>
  );
} 