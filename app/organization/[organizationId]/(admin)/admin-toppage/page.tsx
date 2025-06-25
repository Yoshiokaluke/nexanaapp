import { organizationAdminAuth } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';
import { AdminMenu } from '@/components/organization/AdminMenu';
import OrganizationDetails from '@/app/organization/[organizationId]/(admin)/admin-toppage/OrganizationDetails';

export default async function OrganizationPage({
  params,
}: {
  params: { organizationId: string };
}) {
  const result = await organizationAdminAuth(params.organizationId);
  if (!result.success) {
    return <div className="p-6 text-red-600">アクセス権限がありません</div>;
  }

  const organization = await prisma.organization.findUnique({
    where: { id: params.organizationId },
    include: {
      _count: {
        select: {
          memberships: true,
          qrScanners: true,
        },
      },
    },
  });

  if (!organization) {
    return <div className="p-6">組織が見つかりません</div>;
  }

  return (
    <>
      <AdminMenu />
      <OrganizationDetails organization={organization} />
    </>
  );
} 