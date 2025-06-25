import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { checkOrganizationAdmin } from "@/lib/auth/roles";
import { prisma } from '@/lib/prisma';
// import { AdminOrganizationHeaderWrapper } from '@/components/organization/AdminOrganizationHeaderWrapper';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { organizationId: string };
}) {
  const { userId } = auth();
  const organizationId = params.organizationId;

  if (!userId) {
    redirect("/sign-in");
  }

  // 管理者権限またはシステムチーム権限を確認
  const isAdmin = await checkOrganizationAdmin(userId, organizationId);
  if (!isAdmin) {
    redirect(`/organization/${organizationId}/dashboard`);
  }

  return (
    <div className="admin-layout">
      {/* ヘッダーは表示しない */}
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">{children}</div>
        </div>
      </div>
    </div>
  );
} 