"use client";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Users, Home, Building2, LogOut } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

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
];

export function AdminMenu() {
  const pathname = usePathname();
  const params = useParams();
  const organizationId = params.organizationId as string;

  return (
    <section className="w-full flex flex-col items-center bg-gradient-to-r from-indigo-50 to-white py-6 mb-6">
      <div className="max-w-3xl w-full flex flex-col items-center gap-4 px-2">
        <h2 className="text-xl font-extrabold text-indigo-700 tracking-tight mb-1 text-center drop-shadow-sm">
          管理メニュー
        </h2>
        <nav className="w-full flex flex-col md:flex-row gap-3 justify-center items-stretch">
          {menu.map((item) => {
            const href = item.href(organizationId);
            const isActive = pathname === href;
            const Icon = item.icon;
            return (
              <Link
                key={href}
                href={href}
                className={`group flex-1 min-w-[140px] max-w-xs flex flex-col items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 border-2 shadow-md
                  bg-white text-indigo-800 border-indigo-100
                  hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-400 hover:shadow-lg
                `}
                style={{ textDecoration: "none" }}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 transition-all duration-200
                  bg-indigo-50 group-hover:bg-indigo-200
                `}>
                  <Icon className={`w-5 h-5 text-indigo-500 group-hover:text-indigo-700`} />
                </div>
                <div className="text-base font-bold mb-0.5 tracking-wide text-center">
                  {item.label}
                </div>
                <div className="text-xs text-center text-indigo-500 group-hover:text-indigo-700">{item.desc}</div>
              </Link>
            );
          })}
          {/* ログアウトカード */}
          <div
            className="group flex-1 min-w-[140px] max-w-xs flex flex-col items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 border-2 shadow-md
              bg-white text-indigo-800 border-indigo-100 hover:bg-red-50 hover:text-red-700 hover:border-red-400 hover:shadow-lg"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-full mb-2 transition-all duration-200 bg-red-50 group-hover:bg-red-100">
              <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-700" />
            </div>
            <div className="text-base font-bold mb-0.5 tracking-wide text-center">
              ログアウト
            </div>
            <div className="text-xs text-center text-red-500 group-hover:text-red-700">サインアウト</div>
            <SignOutButton>
              <button
                className="mt-2 px-4 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                aria-label="ログアウト"
                type="button"
              >
                サインアウト
              </button>
            </SignOutButton>
          </div>
        </nav>
      </div>
    </section>
  );
} 