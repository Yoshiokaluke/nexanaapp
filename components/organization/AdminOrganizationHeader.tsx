"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AdminOrganizationHeaderProps {
  organizationId: string;
  organizationName: string;
  isAdmin: boolean;
  isSystemTeam: boolean;
  clerkId?: string | null;
}

export const AdminOrganizationHeader: React.FC<AdminOrganizationHeaderProps> = ({
  organizationId,
  organizationName,
  isAdmin,
  isSystemTeam,
  clerkId,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (clerkId && organizationId) {
      fetch(`/api/organizations/${organizationId}/members/${clerkId}/profile-image`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setProfileImage(data.profileImage || null);
        }
      });
    }
  }, [clerkId, organizationId]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await signOut();
      // サインアウト後に手動でリダイレクト
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラーが発生した場合も手動でリダイレクト
      router.push('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30" data-admin-header>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3" style={{ minHeight: '64px' }}>
        {/* ロゴ・組織名 */}
        <div className="flex items-center gap-3">
          <Link href={`/organization/${organizationId}`} className="flex items-center gap-3 hover:opacity-90 transition-opacity duration-200">
            <Image
              src="/blacklogo.svg"
              alt="NexanaApp"
              width={96}
              height={30}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <span className="text-lg font-semibold text-gray-900">{organizationName}</span>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
            管理者
          </Badge>
        </div>
        {/* ログアウトとアバター・ハンバーガー */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-red-700 transition-colors duration-150 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
          {clerkId && (
            <Link href={`/organization/${organizationId}/OrganizationProfile/${clerkId}}`}>
              <Avatar className="w-9 h-9 border-2 border-indigo-200">
                <AvatarImage src={profileImage || undefined} alt="My Avatar" />
                <AvatarFallback>Me</AvatarFallback>
              </Avatar>
            </Link>
          )}
          {/* ハンバーガーメニュー（今後拡張用） */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニューを開く"
          >
            <span className="sr-only">メニュー</span>
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}; 