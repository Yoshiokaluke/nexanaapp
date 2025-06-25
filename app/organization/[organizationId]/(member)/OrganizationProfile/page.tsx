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
        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">メンバーが見つかりません</h3>
        <p className="text-gray-500">この組織にはまだメンバーがいません。</p>
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
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage 
                    src={member.profileImage ? `${member.profileImage}?v=${new Date(member.updatedAt).getTime()}` : undefined} 
                    alt={member.displayName || 'プロフィール画像'} 
                  />
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg mb-1">
                  {member.displayName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || '名前未設定'}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {member.organizationDepartment?.name || '部署未設定'}
                </p>
                {member.introduction && (
                  <p className="text-sm text-gray-500 line-clamp-2">
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
  params: { organizationId: string };
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          メンバー一覧
        </h1>
        <p className="text-gray-600">
          組織内のメンバーのプロフィールを閲覧できます
        </p>
      </div>
      
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        {await MembersList({ organizationId: params.organizationId })}
      </Suspense>
    </div>
  );
} 