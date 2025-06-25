'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;
  const { userId: clerkId, isLoaded } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkId) {
      router.push('/');
      return;
    }
    const fetchRole = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        // 1. ユーザー情報取得
        const userRes = await fetch('/api/users/me');
        const userData = await userRes.json();
        const systemRole = userData.user?.systemRole;

        // 2. 組織名取得
        const orgRes = await fetch(`/api/organizations/${organizationId}`);
        const orgData = await orgRes.json();

        // 3. 組織メンバーシップ取得
        const membershipRes = await fetch(`/api/organizations/${organizationId}/members/me`);
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          const role = membershipData.role;
          if (role === 'admin' || systemRole === 'system_team') {
            // ユーザーが管理者であるか、システムチームである場合
            // ここで必要な処理を行う
          }
        } else {
          if (systemRole === 'system_team') {
            // ユーザーがシステムチームである場合
            // ここで必要な処理を行う
          }
        }
        setIsLoading(false);
      } catch (error) {
        setHasError(true);
        setIsLoading(false);
        router.push('/organization-list');
      }
    };
    fetchRole();
  }, [clerkId, isLoaded, organizationId, router]);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">アクセスエラーが発生しました</p>
          <button 
            onClick={() => router.push('/organization-list')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            組織一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">{children}</div>
      </div>
    </div>
  );
}