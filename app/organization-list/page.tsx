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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">読み込み中...</h1>
          <p>しばらくお待ちください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 012-2h2a2 2 0 012 2v14M7 21V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14m0 0V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14" /></svg>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">ワークスペースを選択</h1>
        </div>
        <div className="h-1 w-20 bg-blue-100 rounded mt-2 mb-2" />
      </div>
      {organizations.length === 0 ? (
        <p className="text-gray-600">所属している組織がありません</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => router.push(`/organization/${org.id}`)}
              className="group p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-[1.03] transition-all duration-200 flex flex-col items-center text-center cursor-pointer"
            >
              <svg className="w-10 h-10 text-blue-400 mb-2 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 012-2h2a2 2 0 012 2v14M7 21V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14m0 0V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m0 0v14" /></svg>
              <h2 className="font-semibold text-lg md:text-xl text-gray-800 group-hover:text-blue-700 break-words">{org.name}</h2>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 