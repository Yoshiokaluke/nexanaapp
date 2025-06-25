'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface AcceptInvitationPageProps {
  params: {
    organizationId: string;
    invitationId: string;
  };
}

export default function AcceptInvitationPage({ params }: AcceptInvitationPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [authRetryCount, setAuthRetryCount] = useState(0);

  useEffect(() => {
    if (!isLoaded) {
      return; // 認証状態が読み込み中の場合は何もしない
    }

    console.log('Auth state:', { isLoaded, isSignedIn, userId, authRetryCount });

    // 未ログインの場合は、サインインページにリダイレクト
    if (!isSignedIn) {
      console.log('User not signed in, redirecting to sign-in');
      // 招待URLをリダイレクト先に含める
      const redirectUrl = `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
      router.push(redirectUrl);
      return;
    }

    // ログイン済みだがuserIdが取得できない場合、少し待ってから再試行
    if (!userId && authRetryCount < 3) {
      console.log('User signed in but userId not available, retrying...', { authRetryCount });
      setTimeout(() => {
        setAuthRetryCount(prev => prev + 1);
      }, 1000);
      return;
    }

    if (!userId) {
      console.log('User signed in but userId still not available after retries');
      setError('認証情報の取得に失敗しました。ページを再読み込みしてください。');
      setIsLoading(false);
      return;
    }

    // ログイン済みの場合は、オンボーディングページに誘導
    const redirectToOnboarding = async () => {
      try {
        console.log('=== 招待受け入れ処理開始 ===');
        console.log('現在の状態:', {
          userId,
          organizationId: params.organizationId,
          invitationId: params.invitationId,
          token: searchParams.get('token')
        });

        // 新規・既存ユーザー問わず、オンボーディングページに誘導
        console.log('オンボーディングページに誘導');
        toast.info('プロフィール設定が必要です');
        const token = searchParams.get('token');
        const onboardingUrl = `/onboarding?organization_id=${params.organizationId}&invitation_id=${params.invitationId}&token=${token}`;
        console.log('オンボーディングURL:', onboardingUrl);
        router.push(onboardingUrl);
        return;
      } catch (error) {
        console.error('Redirect error:', error);
        setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
        // エラーが発生した場合でも組織リストページにリダイレクト
        setTimeout(() => {
          router.push('/organization-list');
        }, 5000);
      } finally {
        setIsLoading(false);
      }
    };

    redirectToOnboarding();
  }, [isLoaded, isSignedIn, userId, authRetryCount, params.organizationId, params.invitationId, router, searchParams]);

  // 認証状態が読み込み中の場合はローディング表示
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">認証状態を確認中...</h1>
          <p>しばらくお待ちください</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">招待を受け入れています...</h1>
          <p>しばらくお待ちください</p>
          {authRetryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">認証情報を同期中... ({authRetryCount}/3)</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-red-600">エラーが発生しました</h2>
            <p className="text-red-600 mb-4">{error}</p>
            {debugInfo && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">デバッグ情報</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                ページを再読み込み
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 