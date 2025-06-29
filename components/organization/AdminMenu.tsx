"use client";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { Users, Home, Building2, LogOut, Target } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

const menu = [
  {
    href: (orgId: string) => `/organization/${orgId}/admin-toppage`,
    label: "管理トップ",
    icon: Home,
    desc: "組織全体のダッシュボード"
  },
  {
    href: (orgId: string) => `/organization/${orgId}/members`,
    label: "メンバー管理",
    icon: Users,
    desc: "メンバーの招待・権限管理"
  },
  {
    href: (orgId: string) => `/organization/${orgId}/departments`,
    label: "部署管理",
    icon: Building2,
    desc: "部署の追加・編集"
  },
  {
    href: (orgId: string) => `/organization/${orgId}/scan-purposes`,
    label: "スキャン目的管理",
    icon: Target,
    desc: "スキャン目的の設定"
  },
];

export function AdminMenu() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { signOut } = useClerk();
  const organizationId = params.organizationId as string;
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    <section className="w-full flex flex-col items-center bg-[#1E1E1E] py-6 mb-6 border-b border-[#4BEA8A]/30">
      <div className="max-w-3xl w-full flex flex-col items-center gap-4 px-2">
        <h2 className="text-xl font-extrabold text-[#4BEA8A] tracking-tight mb-1 text-center drop-shadow-sm">
          管理メニュー
        </h2>
        <nav className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 justify-center items-stretch max-w-6xl">
          {menu.map((item) => {
            const href = item.href(organizationId);
            const isActive = pathname === href;
            const Icon = item.icon;
            return (
              <Link
                key={href}
                href={href}
                className={`group flex-1 min-w-[140px] flex flex-col items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 border-2 shadow-md
                  bg-[#232323] text-[#4BEA8A] border-[#4BEA8A]/30
                  hover:bg-[#2A2A2A] hover:text-[#FFFFFF] hover:border-[#4BEA8A] hover:shadow-lg
                  ${isActive ? 'ring-2 ring-[#4BEA8A]' : ''}
                `}
                style={{ textDecoration: "none" }}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 transition-all duration-200
                  bg-[#1E1E1E] group-hover:bg-[#4BEA8A]/20
                `}>
                  <Icon className={`w-5 h-5 text-[#4BEA8A] group-hover:text-[#FFFFFF]`} />
                </div>
                <div className="text-base font-bold mb-0.5 tracking-wide text-center">
                  {item.label}
                </div>
                <div className="text-xs text-center text-[#CCCCCC] group-hover:text-[#4BEA8A]">{item.desc}</div>
              </Link>
            );
          })}
          {/* ログアウトカード */}
          <div
            className="group flex-1 min-w-[140px] flex flex-col items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 border-2 shadow-md
              bg-[#232323] text-[#4BEA8A] border-[#4BEA8A]/30 hover:bg-[#2A2A2A] hover:text-[#FFFFFF] hover:border-[#4BEA8A] hover:shadow-lg cursor-pointer"
            onClick={handleSignOut}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-full mb-2 transition-all duration-200 bg-[#1E1E1E] group-hover:bg-[#4BEA8A]/20">
              <LogOut className="w-5 h-5 text-[#4BEA8A] group-hover:text-[#FFFFFF]" />
            </div>
            <div className="text-base font-bold mb-0.5 tracking-wide text-center">
              ログアウト
            </div>
            <div className="text-xs text-center text-[#CCCCCC] group-hover:text-[#4BEA8A]">サインアウト</div>
            <button
              className="mt-2 px-4 py-1 rounded bg-[#4BEA8A] text-[#1E1E1E] text-xs font-semibold hover:bg-[#3DD879] transition-colors disabled:opacity-50"
              aria-label="ログアウト"
              type="button"
              disabled={isSigningOut}
            >
              {isSigningOut ? 'ログアウト中...' : 'サインアウト'}
            </button>
          </div>
        </nav>
      </div>
    </section>
  );
} 