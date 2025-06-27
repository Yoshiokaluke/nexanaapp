'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';

interface Organization {
  id: string;
  name: string;
}

export default function OrganizationListPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user, isLoaded } = useUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        console.log('Fetching organizations for userId:', userId);
        const response = await fetch('/api/organizations/list');
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error('組織の取得に失敗しました');
        }
        const data = await response.json();
        console.log('Received organizations:', data);
        setOrganizations(data);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchOrganizations();
    } else {
      console.log('No userId available yet');
    }
  }, [userId]);

  useEffect(() => {
    const syncUserData = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/users/${user.id}/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.emailAddresses[0]?.emailAddress || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
          }),
        });

        if (!response.ok) {
          console.error("Failed to sync user data");
        }
      } catch (error) {
        console.error("Error syncing user data:", error);
      }
    };

    if (isLoaded && user) {
      syncUserData();
    }
  }, [user, isLoaded]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1E1E1E]">
        <div className="text-center">
          <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-[#4BEA8A] border-t-transparent rounded-full animate-spin mx-auto mb-4 lg:mb-6"></div>
          <h1 className="text-xl lg:text-2xl font-bold mb-2 lg:mb-4 text-white">読み込み中...</h1>
          <p className="text-gray-400 text-sm lg:text-base">組織情報を取得しています</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* ヘッダーセクション */}
      <div className="mb-8 lg:mb-12">
        <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
          <div className="w-8 h-8 lg:w-12 lg:h-12 bg-[#4BEA8A] rounded-lg lg:rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 lg:w-6 lg:h-6 text-[#1E1E1E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 012-2h2a2 2 0 012 2v14M7 21V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14m0 0V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white tracking-tight">
              ワークスペースを選択
            </h1>
            <p className="text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">
              参加している組織から選択して、管理を開始しましょう
            </p>
          </div>
        </div>
        <div className="h-1 w-16 lg:w-24 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full" />
      </div>

      {/* 組織一覧 */}
      {organizations.length === 0 ? (
        <div className="text-center py-12 lg:py-16">
          <div className="w-16 h-16 lg:w-24 lg:h-24 bg-[#2A2A2A] rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
            <svg className="w-8 h-8 lg:w-12 lg:h-12 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 012-2h2a2 2 0 012 2v14M7 21V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14m0 0V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14" />
            </svg>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-4">組織が見つかりません</h2>
          <p className="text-gray-400 mb-6 lg:mb-8 max-w-md mx-auto text-sm lg:text-base px-4">
            現在、参加している組織はありません。新しい組織に招待されるか、組織を作成してください。
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full lg:w-auto bg-[#4BEA8A] text-[#1E1E1E] px-4 lg:px-6 py-3 rounded-lg lg:rounded-full font-semibold hover:bg-[#3DD879] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm lg:text-base"
          >
            ホームに戻る
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => router.push(`/organization/${org.id}`)}
              className="group p-4 lg:p-8 bg-[#2A2A2A] rounded-xl lg:rounded-2xl shadow-lg border border-[#333333] hover:border-[#4BEA8A] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
            >
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-[#4BEA8A] to-[#3DD879] rounded-lg lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#1E1E1E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 012-2h2a2 2 0 012 2v14M7 21V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14m0 0V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14" />
                </svg>
              </div>
              <h2 className="font-bold text-lg lg:text-xl xl:text-2xl text-white group-hover:text-[#4BEA8A] break-words transition-colors duration-300 mb-1 lg:mb-2">
                {org.name}
              </h2>
              <p className="text-gray-400 text-xs lg:text-sm group-hover:text-gray-300 transition-colors duration-300">
                クリックして管理画面を開く
              </p>
            </button>
          ))}
        </div>
      )}

      {/* 追加情報セクション */}
      {organizations.length > 0 && (
        <div className="mt-12 lg:mt-16 text-center">
          <div className="bg-gradient-to-r from-[#4BEA8A]/10 to-transparent rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-[#333333]">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-3 lg:mb-4">
              新しい組織に参加しますか？
            </h3>
            <p className="text-gray-400 mb-4 lg:mb-6 max-w-2xl mx-auto text-sm lg:text-base px-4">
              組織の管理者から招待リンクを受け取った場合は、そのリンクをクリックして新しいワークスペースに参加できます。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center">
              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto text-[#4BEA8A] hover:text-[#3DD879] px-4 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-full font-semibold border-2 border-[#4BEA8A] hover:border-[#3DD879] transition-all duration-200 text-sm lg:text-base"
              >
                ホームに戻る
              </button>
              <button
                onClick={() => window.open('mailto:', '_blank')}
                className="w-full sm:w-auto bg-[#4BEA8A] text-[#1E1E1E] px-4 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-full font-semibold hover:bg-[#3DD879] transition-all duration-200 text-sm lg:text-base"
              >
                サポートに問い合わせ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 