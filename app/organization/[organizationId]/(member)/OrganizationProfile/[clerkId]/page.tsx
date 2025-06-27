'use client';

import { Suspense, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, User, MapPin, Calendar, Globe, Edit, ArrowLeft, Star, Award, Users, FacebookIcon, LinkedinIcon, InstagramIcon } from 'lucide-react';
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
  profile: {
    snsLinks?: Record<string, string>;
    // 必要に応じて他のフィールドも追加
  };
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
      <div className="flex items-center justify-center min-h-48 lg:min-h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 lg:h-32 lg:w-32 border-4 border-[#4BEA8A]/20 border-t-[#4BEA8A]"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 lg:h-32 lg:w-32 border-2 border-[#4BEA8A]/30"></div>
        </div>
      </div>
    );
  }

  if (error || !organizationProfile || !userProfile) {
    return (
      <div className="text-center py-6 lg:py-8">
        <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-red-500/20">
          <h3 className="text-base lg:text-lg font-medium text-white mb-2">プロフィールが見つかりません</h3>
          <p className="text-gray-400 text-sm lg:text-base">このユーザーのプロフィールは存在しません。</p>
        </div>
      </div>
    );
  }

  const imageUrl = organizationProfile.profileImage
    ? `${organizationProfile.profileImage}?v=${new Date(organizationProfile.updatedAt).getTime()}&t=${Date.now()}`
    : '';

  const snsLinks = userProfile.profile?.snsLinks || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
      {/* 左側: プロフィール画像 */}
      <div className="lg:col-span-1">
        <div className="relative group">
          {/* 背景のグラデーション効果 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-2xl lg:rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          
          <Card className="relative bg-gradient-to-br from-[#2A2A2A] to-[#1E1E1E] border-[#333333] shadow-2xl backdrop-blur-sm">
            <CardContent className="p-4 lg:p-8">
              <div className="text-center">
                {/* アバターコンテナ */}
                <div className="relative inline-block mb-4 lg:mb-6">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                  <Avatar 
                    key={`${organizationProfile.id}-${organizationProfile.updatedAt}`}
                    className="relative w-24 h-24 lg:w-36 lg:h-36 mx-auto ring-4 ring-[#4BEA8A]/30 shadow-2xl"
                  >
                    <AvatarImage src={imageUrl} alt="プロフィール画像" />
                    <AvatarFallback className="bg-gradient-to-br from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] text-lg lg:text-2xl font-bold">
                      <User className="w-12 h-12 lg:w-20 lg:h-20" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <h2 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2 lg:mb-3">
                  {organizationProfile.displayName || '名前未設定'}
                </h2>
                
                <Badge className="mb-4 lg:mb-6 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] hover:from-[#3DD879] hover:to-[#4BEA8A] border-none px-3 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm font-semibold shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Users className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                  {organizationProfile.organizationDepartment?.name || '部署未設定'}
                </Badge>

                {/* ステータスインジケーター */}
                <div className="flex items-center justify-center space-x-2 text-[#4BEA8A]">
                  <div className="w-2 h-2 bg-[#4BEA8A] rounded-full animate-pulse"></div>
                  <span className="text-xs lg:text-sm font-medium">オンライン</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 右側: 詳細情報 */}
      <div className="lg:col-span-2 space-y-4 lg:space-y-6">
        {/* 組織プロフィール情報 */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-xl lg:rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          
          <Card className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border-[#333333] shadow-2xl backdrop-blur-sm">
            <CardContent className="p-4 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-lg lg:rounded-xl flex items-center justify-center">
                    <Award className="w-4 h-4 lg:w-5 lg:h-5 text-[#1E1E1E]" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    組織プロフィール情報
                  </h3>
                </div>
                {isOwnProfile && (
                  <Link href={`/organization/${organizationId}/OrganizationProfile/${clerkId}/edit`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full lg:w-auto border-[#6B7280] text-[#6B7280] hover:bg-gradient-to-r hover:from-[#6B7280] hover:to-[#4B5563] hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg text-xs lg:text-sm"
                    >
                      <Edit className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                      組織プロフィール編集
                    </Button>
                  </Link>
                )}
              </div>
              
              <div className="space-y-4 lg:space-y-6">
                <div className="bg-gradient-to-r from-[#333333]/50 to-[#2A2A2A]/50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-[#4BEA8A]/10">
                  <Label className="text-xs lg:text-sm font-semibold text-[#4BEA8A] uppercase tracking-wide">表示名</Label>
                  <p className="text-white mt-1 lg:mt-2 text-base lg:text-lg font-medium">
                    {organizationProfile.displayName || '未設定'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-[#333333]/50 to-[#2A2A2A]/50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-[#4BEA8A]/10">
                  <Label className="text-xs lg:text-sm font-semibold text-[#4BEA8A] uppercase tracking-wide">部署</Label>
                  <p className="text-white mt-1 lg:mt-2 text-base lg:text-lg font-medium">
                    {organizationProfile.organizationDepartment?.name || '未設定'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-[#333333]/50 to-[#2A2A2A]/50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-[#4BEA8A]/10">
                  <Label className="text-xs lg:text-sm font-semibold text-[#4BEA8A] uppercase tracking-wide">自己紹介</Label>
                  <p className="text-gray-300 mt-1 lg:mt-2 whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
                    {organizationProfile.introduction || '未設定'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* グローバルプロフィール情報 */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-xl lg:rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          
          <Card className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border-[#333333] shadow-2xl backdrop-blur-sm">
            <CardContent className="p-4 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-lg lg:rounded-xl flex items-center justify-center">
                    <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-[#1E1E1E]" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    共通プロフィール情報
                  </h3>
                </div>
                {isOwnProfile && (
                  <Link href={`/organization/${organizationId}/OrganizationProfile/${clerkId}/edit/global`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full lg:w-auto border-[#9CA3AF] text-[#9CA3AF] hover:bg-gradient-to-r hover:from-[#9CA3AF] hover:to-[#6B7280] hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg text-xs lg:text-sm"
                    >
                      <Edit className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                      共通プロフィール編集
                    </Button>
                  </Link>
                )}
              </div>
              
              <div className="space-y-4 lg:space-y-6">
                <div className="bg-gradient-to-r from-[#333333]/50 to-[#2A2A2A]/50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-[#4BEA8A]/10">
                  <Label className="text-xs lg:text-sm font-semibold text-[#4BEA8A] uppercase tracking-wide">メールアドレス</Label>
                  <div className="flex items-center space-x-2 lg:space-x-3 mt-1 lg:mt-2">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-md lg:rounded-lg flex items-center justify-center">
                      <Mail className="w-3 h-3 lg:w-4 lg:h-4 text-[#1E1E1E]" />
                    </div>
                    <span className="text-white text-sm lg:text-lg font-medium break-all">{userProfile.email}</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-[#333333]/50 to-[#2A2A2A]/50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-[#4BEA8A]/10">
                  <Label className="text-xs lg:text-sm font-semibold text-[#4BEA8A] uppercase tracking-wide">SNSリンク</Label>
                  <div className="mt-2 lg:mt-3 space-y-2 lg:space-y-3">
                    {snsLinks && Object.keys(snsLinks).length > 0 ? (
                      <>
                        {snsLinks.facebook && (
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-md lg:rounded-lg flex items-center justify-center">
                              <FacebookIcon className="w-3 h-3 lg:w-4 lg:h-4 text-[#1E1E1E]" />
                            </div>
                            <a
                              href={snsLinks.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4BEA8A] hover:underline font-medium text-sm lg:text-base break-all"
                            >
                              Facebook
                            </a>
                          </div>
                        )}
                        {snsLinks.linkedin && (
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-md lg:rounded-lg flex items-center justify-center">
                              <LinkedinIcon className="w-3 h-3 lg:w-4 lg:h-4 text-[#1E1E1E]" />
                            </div>
                            <a
                              href={snsLinks.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4BEA8A] hover:underline font-medium text-sm lg:text-base break-all"
                            >
                              LinkedIn
                            </a>
                          </div>
                        )}
                        {snsLinks.instagram && (
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-md lg:rounded-lg flex items-center justify-center">
                              <InstagramIcon className="w-3 h-3 lg:w-4 lg:h-4 text-[#1E1E1E]" />
                            </div>
                            <a
                              href={snsLinks.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4BEA8A] hover:underline font-medium text-sm lg:text-base break-all"
                            >
                              Instagram
                            </a>
                          </div>
                        )}
                        {(!snsLinks.facebook && !snsLinks.linkedin && !snsLinks.instagram) && (
                          <p className="text-gray-400 italic text-sm lg:text-base">未設定</p>
                        )}
                      </>
                    ) : (
                      <div>
                        <p className="text-gray-400 italic text-sm lg:text-base">未設定</p>
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">デバッグ情報</summary>
                          <pre className="text-xs text-gray-400 mt-1 bg-[#1E1E1E] p-2 rounded overflow-auto">
                            {JSON.stringify(snsLinks, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationProfilePage() {
  const params = useParams();
  const { organizationId, clerkId } = params as { organizationId: string; clerkId: string };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#1A1A1A] to-[#0F0F0F] relative overflow-hidden">
      {/* 背景の装飾要素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4BEA8A]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#3DD879]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4BEA8A]/3 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-4 lg:py-8 max-w-6xl">
        <div className="mb-8 lg:mb-12 text-center">
          <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-white via-[#4BEA8A] to-white bg-clip-text text-transparent mb-3 lg:mb-4">
            プロフィール
          </h1>
          <div className="w-16 lg:w-24 h-1 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] mx-auto rounded-full"></div>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-48 lg:min-h-64">
            <div className="text-white text-base lg:text-lg">読み込み中...</div>
          </div>
        }>
          <ProfileDisplay organizationId={organizationId} clerkId={clerkId} />
        </Suspense>
      </div>
    </div>
  );
} 