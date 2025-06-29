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
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    console.log('OrganizationHeader: useEffect triggered with clerkId:', clerkId, 'organizationId:', organizationId);
    if (clerkId && organizationId) {
      console.log('OrganizationHeader: Fetching profile image...');
      fetch(`/api/organizations/${organizationId}/members/${clerkId}/profile-image`).then(async (res) => {
        console.log('OrganizationHeader: Profile image response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('OrganizationHeader: Profile image data:', data);
          setProfileImage(data.profileImage || null);
        } else {
          console.log('OrganizationHeader: Profile image not found');
        }
      }).catch(err => {
        console.error('OrganizationHeader: Error fetching profile image:', err);
      });
    } else {
      console.log('OrganizationHeader: Missing clerkId or organizationId, skipping profile image fetch');
    }
  }, [clerkId, organizationId]);

  useEffect(() => {
    // PWA（スタンドアロン）モードか判定
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWA(true);
    }
  }, []);

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
    { href: `/organization/${organizationId}`, label: "Top" },
    { href: `/organization/${organizationId}/my-qr`, label: "MY-QR" },
    { href: `/organization/${organizationId}/OrganizationProfile`, label: "Member" },
  ].filter(Boolean) as { href: string; label: string }[];

  if (isPWA) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#d32f2f', background: '#fff' }}>
        <h2>カメラ機能をご利用の場合はSafariから直接アクセスしてください</h2>
        <p>ホーム画面からの起動（PWA）ではカメラがご利用いただけません。</p>
        <p>Safariで <b>https://nexanahq.com/scanner/login</b> を開いてご利用ください。</p>
      </div>
    );
  }

  return (
    <header className="bg-[#1E1E1E] shadow-sm sticky top-0 z-30" data-regular-header>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3" style={{ minHeight: '64px' }}>
        {/* ロゴ */}
        <Link href={`/organization/${organizationId}`} className="flex items-center gap-3 hover:opacity-90 transition-opacity duration-200">
          <Image
            src="/White.w.logo.svg"
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
              className="text-white hover:text-[#4BEA8A] transition-colors duration-150 px-3 py-2 rounded-lg hover:bg-[#232323]"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="ml-4 bg-[#4BEA8A] text-[#1E1E1E] px-5 py-2 rounded-full font-semibold shadow hover:bg-[#3DD879] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
          {clerkId && (
            <Link href={`/organization/${organizationId}/OrganizationProfile/${clerkId || ''}`} className="ml-4">
              <Avatar className="w-9 h-9 aspect-square border-2 border-[#4BEA8A] bg-[#232323]">
                {profileImage && (
                  <AvatarImage 
                    src={profileImage} 
                    alt="My Avatar"
                    onLoad={() => console.log('AvatarImage loaded successfully:', profileImage)}
                    onError={(e) => console.error('AvatarImage failed to load:', profileImage, e)}
                  />
                )}
                <AvatarFallback className="bg-[#232323] text-white text-base font-semibold">Me</AvatarFallback>
              </Avatar>
            </Link>
          )}
        </nav>
        {/* モバイルハンバーガー＋ユーザーアイコン */}
        <div className="md:hidden flex items-center gap-2">
          {/* My-QRアイコン */}
          <Link 
            href={`/organization/${organizationId}/my-qr`}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#232323] hover:bg-[#333] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#4BEA8A]"
            aria-label="My-QR"
          >
            <svg className="w-6 h-6 text-[#4BEA8A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
            </svg>
          </Link>
          <Link href={`/organization/${organizationId}/OrganizationProfile/${clerkId || ''}`}>
            <Avatar className="w-8 h-8 aspect-square border-2 border-[#4BEA8A] bg-[#232323]">
              {profileImage && (
                <AvatarImage 
                  src={profileImage} 
                  alt="My Avatar"
                  onLoad={() => console.log('Mobile AvatarImage loaded successfully:', profileImage)}
                  onError={(e) => console.error('Mobile AvatarImage failed to load:', profileImage, e)}
                />
              )}
              <AvatarFallback className="bg-[#232323] text-white text-base font-semibold">Me</AvatarFallback>
            </Avatar>
          </Link>
          <button
            className="flex items-center justify-center w-10 h-10 rounded focus:outline-none focus:ring-2 focus:ring-[#4BEA8A]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニューを開く"
          >
            <span className="sr-only">メニュー</span>
            <svg className="w-7 h-7 text-[#4BEA8A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
          <aside className="fixed top-0 right-0 z-50 h-full w-4/5 max-w-xs bg-[#232323] shadow-2xl rounded-l-2xl flex flex-col py-8 px-6 animate-slide-in">
            {/* 閉じるボタン */}
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#333] focus:outline-none"
              onClick={() => setMenuOpen(false)}
              aria-label="メニューを閉じる"
            >
              <svg className="w-6 h-6 text-[#4BEA8A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-3 mb-8">
              <Image src="/White.w.logo.svg" alt="NexanaApp" width={96} height={30} className="h-8 w-auto" />
            </div>
            <nav className="flex flex-col gap-4 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-base text-white hover:text-[#4BEA8A] font-semibold rounded-lg px-3 py-3 transition-colors duration-150"
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
                className="block w-full bg-[#4BEA8A] text-[#1E1E1E] text-base font-bold rounded-full py-3 shadow hover:bg-[#3DD879] transition-colors duration-150 cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
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