import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { QrCodeDisplay } from '@/components/qr-code/QrCodeDisplay';
import { Card, CardContent } from '@/components/ui/card';

interface MyQrPageProps {
  params: {
    organizationId: string;
  };
}

export default async function MyQrPage({ params }: MyQrPageProps) {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // ユーザーのシステムロールを確認
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { systemRole: true }
  });

  // system_teamの場合は全アクセス可能
  const isSystemTeam = user?.systemRole === 'system_team';

  // 組織のメンバーシップを確認
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      clerkId_organizationId: {
        clerkId: userId,
        organizationId: params.organizationId
      }
    },
    include: {
      organization: true
    }
  });

  // 組織情報を取得（system_teamの場合も必要）
  const organization = await prisma.organization.findUnique({
    where: { id: params.organizationId },
    select: { name: true }
  });

  if (!membership && !isSystemTeam) {
    redirect('/organization-list');
  }

  // isAdmin判定
  const isAdmin = membership?.role === 'admin' || isSystemTeam;

  // ユーザーのOrganizationProfileを取得
  const profile = await prisma.organizationProfile.findUnique({
    where: {
      clerkId_organizationId: {
        clerkId: userId,
        organizationId: params.organizationId
      }
    },
    include: {
      user: true,
      organization: true,
      organizationDepartment: true
    }
  });

  // system_teamでもプロファイルがない場合は作成を促す
  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              この組織でのプロファイルが見つかりません。
            </p>
            <p className="text-sm text-gray-500">
              プロフィールページでプロファイルを作成してください。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 自分のQRコードを表示（system_teamでも自分のみ）
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">マイQRコード</h1>
        <p className="text-gray-600">
          {organization?.name || membership?.organization.name}でのあなたのQRコードです。
          {isSystemTeam && <span className="text-blue-600"> (システム管理者)</span>}
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <QrCodeDisplay
          organizationProfileId={profile.id}
          displayName={profile.displayName || `${profile.user.firstName} ${profile.user.lastName}`}
          organizationName={organization?.name || membership?.organization.name}
          departmentName={profile.organizationDepartment?.name}
        />
      </div>
    </div>
  );
} 