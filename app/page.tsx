import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  
  // ログイン済みユーザーは組織一覧ページにリダイレクト
  if (userId) {
    redirect("/organization-list");
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image 
                src="/blacklogo.svg" 
                alt="AppNexana" 
                width={150} 
                height={45} 
                className="h-9 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/sign-in" 
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ログイン
              </Link>
              <Link 
                href="/sign-up" 
                className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors duration-200 font-medium"
              >
                新規作成
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Hero Section */}
          <div className="space-y-8">
            <h2 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
              素敵な組織管理は
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ここから始まります
              </span>
          </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              組織ページを作成し、メンバーを招待してQRコードで管理。
              <br />
              今日から思い出に残る組織運営を始めましょう。
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link 
                href="/sign-up"
                className="bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                新規作成
              </Link>
              <Link 
                href="/sign-in"
                className="text-indigo-600 hover:text-indigo-700 px-8 py-4 rounded-full text-lg font-semibold border-2 border-indigo-600 hover:border-indigo-700 transition-all duration-200"
              >
                ログイン
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">簡単な組織管理</h3>
              <p className="text-gray-600">直感的なインターフェースで組織とメンバーを簡単に管理できます</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">QRコード認証</h3>
              <p className="text-gray-600">セキュアなQRコードでメンバー認証を簡単に行えます</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">リアルタイム同期</h3>
              <p className="text-gray-600">メンバーの変更や更新がリアルタイムで同期されます</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative mt-24 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-600">
              © 2024 AppNexana. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors duration-200">利用規約</a>
              <a href="#" className="hover:text-gray-900 transition-colors duration-200">プライバシー</a>
              <a href="#" className="hover:text-gray-900 transition-colors duration-200">セキュリティ</a>
              <a href="#" className="hover:text-gray-900 transition-colors duration-200">ヘルプ</a>
            </div>
        </div>
      </div>
      </footer>
    </div>
  );
}
