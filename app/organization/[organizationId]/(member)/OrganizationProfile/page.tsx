import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';
import Link from 'next/link';
import { getOrganizationMembers } from '@/lib/auth/utils';

async function MembersList({ organizationId }: { organizationId: string }) {
  const members = await getOrganizationMembers(organizationId);

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 mx-auto text-[#4BEA8A] mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">メンバーが見つかりません</h3>
        <p className="text-[#4BEA8A]">この組織にはまだメンバーがいません。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <Link 
          key={member.clerkId} 
          href={`/organization/${organizationId}/OrganizationProfile/${member.clerkId}`}
          className="block"
        >
          <Card className="bg-[#232323] border border-[#4BEA8A] rounded-2xl shadow-xl hover:shadow-2xl hover:border-2 hover:border-[#4BEA8A] transition">
            <CardContent className="p-6">
              <div className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-[#4BEA8A]">
                  <AvatarImage 
                    src={member.profileImage ? `${member.profileImage}?v=${new Date(member.updatedAt).getTime()}` : undefined} 
                    alt={member.displayName || 'プロフィール画像'} 
                  />
                  <AvatarFallback>
                    <User className="w-8 h-8 text-[#4BEA8A]" />
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg text-white mb-1">
                  {member.displayName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || '名前未設定'}
                </h3>
                <p className="text-sm text-[#4BEA8A] font-semibold mb-2">
                  {member.organizationDepartment?.name || '部署未設定'}
                </p>
                {member.introduction && (
                  <p className="text-sm text-white/70 line-clamp-2">
                    {member.introduction}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default async function OrganizationProfileListPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return (
    <div className="bg-[#1E1E1E] min-h-screen py-8">
      <div className="mb-8 px-4">
        <h1 className="text-3xl font-bold text-white mb-2">
          メンバー
        </h1>
        <p className="text-[#4BEA8A]">
          組織内のメンバーのプロフィールを閲覧できます
        </p>
      </div>
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#232323] border border-[#4BEA8A] rounded-2xl shadow-xl animate-pulse">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-[#1E1E1E] rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-[#4BEA8A] rounded mb-2"></div>
                  <div className="h-3 bg-[#4BEA8A]/60 rounded w-2/3 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        {await MembersList({ organizationId: organizationId })}
      </Suspense>
    </div>
  );
} 