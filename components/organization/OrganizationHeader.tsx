"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OrganizationHeaderProps {
  organizationId: string;
  organizationName: string;
  isAdmin: boolean;
  isSystemTeam: boolean;
  clerkId?: string | null;
}

export const OrganizationHeader: React.FC<OrganizationHeaderProps> = ({
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

  const navLinks = [
    { href: `/organization/${organizationId}`, label: "トップ" },
    { href: `/organization/${organizationId}/my-qr`, label: "MY-QR" },
    { href: `/organization/${organizationId}/OrganizationProfile`, label: "メンバー一覧" },
    clerkId && { href: `/organization/${organizationId}/OrganizationProfile/${clerkId}`, label: "MyPage" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30" data-regular-header>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3" style={{ minHeight: '64px' }}>
        {/* ロゴ・組織名 */}
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
        {/* PCナビゲーション */}
        <nav className="hidden md:flex items-center gap-8 text-base font-semibold">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-700 hover:text-indigo-600 transition-colors duration-150 px-3 py-2 rounded-lg hover:bg-indigo-50"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="ml-4 bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold shadow hover:bg-indigo-700 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
          {clerkId && (
            <Link href={`/organization/${organizationId}/OrganizationProfile/${clerkId}`} className="ml-4">
              <Avatar className="w-9 h-9 border-2 border-indigo-200">
                <AvatarImage src={profileImage || undefined} alt="My Avatar" />
                <AvatarFallback>Me</AvatarFallback>
              </Avatar>
            </Link>
          )}
        </nav>
        {/* モバイルハンバーガー＋ユーザーアイコン */}
        <div className="md:hidden flex items-center gap-2">
          {clerkId && (
            <Link href={`/organization/${organizationId}/OrganizationProfile/${clerkId}`}>
              <Avatar className="w-8 h-8 border-2 border-indigo-200">
                <AvatarImage src={profileImage || undefined} alt="My Avatar" />
                <AvatarFallback>Me</AvatarFallback>
              </Avatar>
            </Link>
          )}
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
      {/* モバイルサイドメニュー */}
      {menuOpen && (
        <>
          {/* オーバーレイ */}
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setMenuOpen(false)} />
          {/* サイドメニュー */}
          <aside className="fixed top-0 right-0 z-50 h-full w-4/5 max-w-xs bg-white shadow-2xl rounded-l-2xl flex flex-col py-8 px-6 animate-slide-in">
            {/* 閉じるボタン */}
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none"
              onClick={() => setMenuOpen(false)}
              aria-label="メニューを閉じる"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-3 mb-8">
              <Image src="/blacklogo.svg" alt="NexanaApp" width={96} height={30} className="h-8 w-auto" />
            </div>
            <nav className="flex flex-col gap-4 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-base text-gray-800 hover:text-indigo-600 font-semibold rounded-lg px-3 py-3 transition-colors duration-150"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="block w-full bg-indigo-600 text-white text-base font-bold rounded-full py-3 shadow hover:bg-indigo-700 transition-colors duration-150 cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
              </button>
            </div>
          </aside>
          <style jsx global>{`
            @keyframes slide-in {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .animate-slide-in {
              animation: slide-in 0.25s cubic-bezier(0.4,0,0.2,1);
            }
          `}</style>
        </>
      )}
    </header>
  );
}; 