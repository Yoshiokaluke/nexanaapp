'use client';

import { Suspense, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, User, MapPin, Calendar, Globe, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { useAuth } from '@clerk/nextjs';

interface OrganizationProfile {
  id: string;
  clerkId: string;
  organizationId: string;
  displayName: string | null;
  organizationDepartmentId: string;
  introduction: string | null;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
  organizationDepartment?: {
    id: string;
    name: string;
  };
}

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  snsLinks?: Record<string, string>;
}

function ProfileDisplay({ 
  organizationId, 
  clerkId 
}: { 
  organizationId: string; 
  clerkId: string; 
}) {
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuth();

  // 現在のユーザーが表示対象のユーザーと一致するかチェック
  const isOwnProfile = userId === clerkId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 組織プロフィールを取得
        const profileResponse = await fetch(
          `/api/organizations/${organizationId}/members/${clerkId}/organization-profile`
        );
        if (!profileResponse.ok) {
          throw new Error('プロフィールの取得に失敗しました');
        }
        const profileData = await profileResponse.json();
        setOrganizationProfile(profileData);

        // ユーザープロフィールを取得
        const userResponse = await fetch(`/api/users/${clerkId}/profile?organizationId=${organizationId}`);
        if (!userResponse.ok) {
          throw new Error('ユーザー情報の取得に失敗しました');
        }
        const userData = await userResponse.json();
        setUserProfile(userData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [organizationId, clerkId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !organizationProfile || !userProfile) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">プロフィールが見つかりません</h3>
        <p className="text-gray-500">このユーザーのプロフィールは存在しません。</p>
      </div>
    );
  }

  const imageUrl = organizationProfile.profileImage
    ? `${organizationProfile.profileImage}?v=${new Date(organizationProfile.updatedAt).getTime()}&t=${Date.now()}`
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 左側: プロフィール画像 */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Avatar 
                key={`${organizationProfile.id}-${organizationProfile.updatedAt}`}
                className="w-32 h-32 mx-auto mb-4"
              >
                <AvatarImage src={imageUrl} alt="プロフィール画像" />
                <AvatarFallback>
                  <User className="w-16 h-16" />
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {organizationProfile.displayName || '名前未設定'}
              </h2>
              
              <Badge variant="secondary" className="mb-4">
                {organizationProfile.organizationDepartment?.name || '部署未設定'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右側: 詳細情報 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 組織プロフィール情報 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">組織プロフィール情報</h3>
              {isOwnProfile && (
                <Link href={`/organization/${organizationId}/OrganizationProfile/${clerkId}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    組織プロフィール編集
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">表示名</Label>
                <p className="text-gray-900 mt-1">
                  {organizationProfile.displayName || '未設定'}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">部署</Label>
                <p className="text-gray-900 mt-1">
                  {organizationProfile.organizationDepartment?.name || '未設定'}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">自己紹介</Label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                  {organizationProfile.introduction || '未設定'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* グローバルプロフィール情報 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">共通プロフィール情報</h3>
              {isOwnProfile && (
                <Link href={`/organization/${organizationId}/OrganizationProfile/${clerkId}/edit/global`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    共通プロフィール編集
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">メールアドレス</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{userProfile.email}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">SNSリンク</Label>
                <div className="mt-1">
                  {userProfile.snsLinks && Object.keys(userProfile.snsLinks).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(userProfile.snsLinks).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                        >
                          {platform}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">未設定</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OrganizationProfilePage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const clerkId = params.clerkId as string;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* ヘッダー */}
      <div className="mb-8">
        {/* <Link 
          href={`/organization/${organizationId}/OrganizationProfile`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          メンバー一覧に戻る
        </Link> */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          メンバープロフィール
        </h1>
        <p className="text-gray-600">
          組織内のメンバーの詳細プロフィールを表示します
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      }>
        <ProfileDisplay 
          organizationId={organizationId} 
          clerkId={clerkId} 
        />
      </Suspense>
    </div>
  );
} 