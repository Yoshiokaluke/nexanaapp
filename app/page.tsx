import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import MobileMenu from "./components/MobileMenu";
import Script from "next/script";

export default async function Home() {
  const { userId } = await auth();
  
  // ログイン済みユーザーは組織一覧ページにリダイレクト
  if (userId) {
    redirect("/organization-list");
  }
  
  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      {/* 構造化データ */}
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Nexana App",
            "description": "組織管理とQRコードスキャン機能を提供するWebアプリケーション",
            "url": "https://nexanahq.com",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "JPY"
            },
            "author": {
              "@type": "Organization",
              "name": "Nexana Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Nexana"
            }
          })
        }}
      />
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image 
                src="/White.w.logo.svg" 
                alt="AppNexana" 
                width={150} 
                height={45} 
                className="h-9 w-auto"
              />
            </div>
            {/* PC用ヘッダー */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/sign-in" 
                className="text-white hover:text-[#4BEA8A] transition-colors duration-200 font-medium"
              >
                ログイン
              </Link>
              <Link 
                href="/sign-up" 
                className="bg-[#4BEA8A] text-[#1E1E1E] px-6 py-3 rounded-full hover:bg-[#3DD879] transition-all duration-200 font-semibold shadow-lg"
              >
                新規作成
              </Link>
            </div>
            {/* モバイル用ハンバーガーメニュー */}
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section - PC用 */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-6xl font-bold leading-tight">
                  <span className="text-white">次世代の</span>
                  <br />
                  <span className="text-[#4BEA8A]">組織管理</span>
                  <br />
                  <span className="text-white">プラットフォーム</span>
                </h1>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  QRコード認証とリアルタイム同期で、組織運営をよりスマートに。
                  <br />
                  メンバー管理からイベント運営まで、すべてがシームレスに。
                </p>

                <div className="flex gap-6 pt-8">
                  <Link 
                    href="/sign-up"
                    className="bg-[#4BEA8A] text-[#1E1E1E] px-8 py-4 rounded-full text-lg font-bold hover:bg-[#3DD879] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    無料で始める
                  </Link>
                  <Link 
                    href="/sign-in"
                    className="text-[#4BEA8A] hover:text-[#3DD879] px-8 py-4 rounded-full text-lg font-semibold border-2 border-[#4BEA8A] hover:border-[#3DD879] transition-all duration-200"
                  >
                    ログイン
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-[#4BEA8A]/20 to-transparent rounded-3xl p-8">
                  <div className="bg-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#4BEA8A] rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">組織管理</h3>
                          <p className="text-gray-400 text-sm">メンバー・部署・権限管理</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#4BEA8A] rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">QR認証</h3>
                          <p className="text-gray-400 text-sm">セキュアな入退室管理</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#4BEA8A] rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">リアルタイム同期</h3>
                          <p className="text-gray-400 text-sm">即座に反映される変更</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Section - モバイル用 */}
          <div className="lg:hidden text-center space-y-8">
            <h1 className="text-4xl font-bold leading-tight">
              <span className="text-white">次世代の</span>
              <br />
              <span className="text-[#4BEA8A]">組織管理</span>
              <br />
              <span className="text-white">プラットフォーム</span>
            </h1>
            
            <p className="text-lg text-gray-300 leading-relaxed px-4">
              QRコード認証とリアルタイム同期で、組織運営をよりスマートに。
              メンバー管理からイベント運営まで、すべてがシームレスに。
            </p>

            <div className="flex flex-col gap-4 pt-8 px-4">
              <Link 
                href="/sign-up"
                className="bg-[#4BEA8A] text-[#1E1E1E] px-8 py-4 rounded-full text-lg font-bold hover:bg-[#3DD879] transition-all duration-200 shadow-lg"
              >
                無料で始める
              </Link>
              <Link 
                href="/sign-in"
                className="text-[#4BEA8A] hover:text-[#3DD879] px-8 py-4 rounded-full text-lg font-semibold border-2 border-[#4BEA8A] hover:border-[#3DD879] transition-all duration-200"
              >
                ログイン
              </Link>
            </div>
          </div>

          {/* Features Section - PC用 */}
          <div className="hidden lg:block mt-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">なぜAppNexanaなのか</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                従来の組織管理ツールでは実現できない、次世代の機能を提供します
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-[#2A2A2A] rounded-2xl p-8 hover:bg-[#333333] transition-all duration-300 group">
                <div className="w-16 h-16 bg-[#4BEA8A] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">直感的な管理</h3>
                <p className="text-gray-300 leading-relaxed">
                  ドラッグ&ドロップでメンバーを配置し、部署や権限を簡単に管理。
                  複雑な設定は不要で、誰でもすぐに使いこなせます。
                </p>
              </div>
              
              <div className="bg-[#2A2A2A] rounded-2xl p-8 hover:bg-[#333333] transition-all duration-300 group">
                <div className="w-16 h-16 bg-[#4BEA8A] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">セキュアな認証</h3>
                <p className="text-gray-300 leading-relaxed">
                  独自のQRコード認証システムで、入退室やイベント参加を安全に管理。
                  不正アクセスを防ぎ、確実な本人確認を実現します。
                </p>
              </div>
              
              <div className="bg-[#2A2A2A] rounded-2xl p-8 hover:bg-[#333333] transition-all duration-300 group">
                <div className="w-16 h-16 bg-[#4BEA8A] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">リアルタイム同期</h3>
                <p className="text-gray-300 leading-relaxed">
                  メンバーの変更や更新が即座に全員に反映。
                  常に最新の情報を共有し、効率的なコミュニケーションを実現します。
                </p>
              </div>
            </div>
          </div>

          {/* Features Section - モバイル用 */}
          <div className="lg:hidden mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">主な機能</h2>
              <p className="text-lg text-gray-300 px-4">
                次世代の組織管理機能を提供します
              </p>
            </div>
            
            <div className="space-y-6 px-4">
              <div className="bg-[#2A2A2A] rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#4BEA8A] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">直感的な管理</h3>
                    <p className="text-gray-300 text-sm">
                      ドラッグ&ドロップでメンバーを配置し、部署や権限を簡単に管理
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#2A2A2A] rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#4BEA8A] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">セキュアな認証</h3>
                    <p className="text-gray-300 text-sm">
                      独自のQRコード認証システムで、入退室やイベント参加を安全に管理
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#2A2A2A] rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#4BEA8A] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">リアルタイム同期</h3>
                    <p className="text-gray-300 text-sm">
                      メンバーの変更や更新が即座に全員に反映され、常に最新の情報を共有
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <div className="bg-gradient-to-r from-[#4BEA8A]/20 to-transparent rounded-3xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                今すぐ始めませんか？
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                無料で組織管理を始めて、より効率的な運営を実現しましょう
              </p>
              <Link 
                href="/sign-up"
                className="inline-block bg-[#4BEA8A] text-[#1E1E1E] px-10 py-4 rounded-full text-xl font-bold hover:bg-[#3DD879] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                無料で始める
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative mt-24 border-t border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Image 
                src="/White.w.logo.svg" 
                alt="AppNexana" 
                width={150} 
                height={45} 
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-400 max-w-md">
                次世代の組織管理プラットフォーム。QRコード認証とリアルタイム同期で、
                組織運営をよりスマートに、より効率的に。
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">製品</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#4BEA8A] transition-colors">機能</a></li>
                <li><a href="#" className="hover:text-[#4BEA8A] transition-colors">料金</a></li>
                <li><a href="#" className="hover:text-[#4BEA8A] transition-colors">セキュリティ</a></li>
                <li><a href="#" className="hover:text-[#4BEA8A] transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#4BEA8A] transition-colors">ヘルプセンター</a></li>
                <li><a href="#" className="hover:text-[#4BEA8A] transition-colors">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-[#4BEA8A] transition-colors">利用規約</a></li>
                <li><a href="#" className="hover:text-[#4BEA8A] transition-colors">プライバシー</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#333333] mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 AppNexana. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
