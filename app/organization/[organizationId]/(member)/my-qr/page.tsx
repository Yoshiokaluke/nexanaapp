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
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#1E1E1E] flex items-start justify-center py-12 px-2">
      <div className="w-full max-w-md bg-[#232323] rounded-2xl shadow-xl border border-[#4BEA8A] p-8 flex flex-col items-center">
        {/* 上部：残り時間＋更新ボタン */}
        <div className="flex w-full justify-between items-center mb-6">
          {/* 残り時間バッジ（仮） */}
          <span className="px-3 py-1 rounded-full bg-[#1E1E1E] text-[#4BEA8A] text-xs font-bold">
            残り: 4:37
          </span>
          <button className="px-4 py-1 rounded-full bg-[#4BEA8A] text-[#1E1E1E] font-bold hover:brightness-110 transition">
            更新
          </button>
        </div>
        {/* QRコード */}
        <div className="my-4">
          <QrCodeDisplay
            organizationProfileId={profile.id}
            displayName={profile.displayName || `${profile.user.firstName} ${profile.user.lastName}`}
            organizationName={organization?.name || membership?.organization.name}
            departmentName={profile.organizationDepartment?.name}
          />
        </div>
        {/* 表示名のみ */}
        <div className="w-full mt-6">
          <span className="text-xs text-[#4BEA8A] font-bold">表示名</span>
          <div className="text-lg text-white font-semibold">{profile.displayName || `${profile.user.firstName} ${profile.user.lastName}`}</div>
        </div>
        {/* 有効期限説明 */}
        <div className="mt-8 text-xs text-[#4BEA8A] text-center opacity-80">
          このQRコードは5分間有効です
        </div>
      </div>
    </div>
  );
} 