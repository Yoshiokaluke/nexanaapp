import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { QrCodeDisplay } from '@/components/qr-code/QrCodeDisplay';
import { Card, CardContent } from '@/components/ui/card';
import Image from "next/image";

interface MyQrPageProps {
  params: Promise<{ organizationId: string }>;
}

export default async function MyQrPage({ params }: MyQrPageProps) {
  const { organizationId } = await params;
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
        organizationId: organizationId
      }
    },
    include: {
      organization: true
    }
  });

  // 組織情報を取得（system_teamの場合も必要）
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
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
        organizationId: organizationId
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  プロファイルが見つかりません
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  この組織でのプロファイルが見つかりません。<br />
                  プロフィールページでプロファイルを作成してください。
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  プロファイル作成が必要です
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 自分のQRコードを表示（system_teamでも自分のみ）
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="relative container mx-auto pt-4 pb-8 px-2 sm:px-4">
        {/* QRコード表示エリアを中央に大きく（PC時はmax-w-lg） */}
        <div className="mx-auto mt-2 max-w-xs md:max-w-lg">
          {/* ロゴをQRコードの上に表示 */}
          <div className="flex justify-center mb-4">
            <Image src="/blacklogo.svg" alt="Nexana Logo" width={128} height={40} className="w-24 md:w-32 h-auto" priority />
          </div>
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg md:shadow-2xl p-4 md:p-10 border border-gray-100">
            <QrCodeDisplay
              organizationProfileId={profile.id}
              displayName={profile.displayName || `${profile.user.firstName} ${profile.user.lastName}`}
              organizationName={organization?.name || membership?.organization.name}
              departmentName={profile.organizationDepartment?.name}
            />
          </div>
        </div>

        {/* 追加情報カードのみ */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow">
              <div className="flex items-center mb-2">
                <div className="w-7 h-7 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">プロフィール</h3>
              </div>
              <p className="text-gray-600 text-xs">
                {profile.displayName || `${profile.user.firstName} ${profile.user.lastName}`}
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow">
              <div className="flex items-center mb-2">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">組織</h3>
              </div>
              <p className="text-gray-600 text-xs">
                {organization?.name || membership?.organization.name}
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow">
              <div className="flex items-center mb-2">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">部門</h3>
              </div>
              <p className="text-gray-600 text-xs">
                {profile.organizationDepartment?.name || '未設定'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 