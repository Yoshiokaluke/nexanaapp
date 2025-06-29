'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import PWAInstallPrompt from '@/components/scanner/PWAInstallPrompt';

interface ScannerInfo {
  scannerName: string;
  organizationName: string;
}

export default function ScannerDashboard() {
  const router = useRouter();
  const [scannerInfo, setScannerInfo] = useState<ScannerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // スキャナーセッション情報を取得
    const checkSession = async () => {
      try {
        const response = await fetch('/api/scanner/auth/check', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // データが正しく取得できた場合のみセット
          if (data.scanner && data.scanner.name && data.scanner.organizationName) {
            setScannerInfo({
              scannerName: data.scanner.name,
              organizationName: data.scanner.organizationName
            });
          } else {
            // データが不完全な場合はログインページにリダイレクト
            console.log('スキャナー情報が不完全です:', data);
            router.replace('/scanner/login');
          }
        } else {
          // レスポンスが正常でない場合はログインページにリダイレクト
          console.log('認証チェックに失敗しました:', response.status, response.statusText);
          router.replace('/scanner/login');
        }
      } catch (error) {
        // エラーが発生した場合はログインページにリダイレクト
        console.error('セッション確認エラー:', error);
        router.replace('/scanner/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [router]);

  const handleScanTogether = () => {
    router.push('/scanner/scan-together/purpose');
  };
  const handleTicketUse = () => {
    router.push('/scanner/ticket');
  };
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/scanner/auth', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      // ログアウト処理の成功・失敗に関わらずログインページにリダイレクト
      console.log('ログアウト処理完了:', response.status);
    } catch (error) {
      console.error('ログアウト処理エラー:', error);
    } finally {
      // エラーが発生しても確実にログインページにリダイレクト
      router.push('/scanner/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1E1E1E' }}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#4BEA8A]/30 border-t-[#4BEA8A] mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-white animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-medium text-white">読み込み中...</p>
          <div className="mt-2 flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-[#4BEA8A] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-[#4BEA8A] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#1E1E1E' }}>
      {/* 背景装飾（グリーンの光） */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4BEA8A]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#4BEA8A]/10 rounded-full blur-3xl"></div>
      </div>

      {/* ロゴを一番上の真ん中に配置 */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
        <Image src="/White.w.logo.svg" alt="ロゴ" width={240} height={240} priority />
      </div>

      {/* メインコンテンツ（ロゴ分の余白を上部に追加） */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-32 p-6">
        {/* ScanTogetherとチケット利用を中央に大きく表示 */}
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-4xl">
          {/* ScanTogether カード */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-[#232323] shadow-xl h-96 w-80 flex flex-col justify-between">
            <CardHeader className="text-center pb-4 h-1/2 flex flex-col justify-center">
              <div className="mx-auto mb-6 w-24 h-24 bg-[#4BEA8A] rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-12 h-12 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <CardTitle className="text-4xl font-bold text-white mb-2">ScanTogether</CardTitle>
              <p className="text-xl text-[#4BEA8A]">みんなで一緒にスキャン</p>
            </CardHeader>
            <CardContent className="h-1/2 flex items-end">
              <Button
                onClick={handleScanTogether}
                className="w-full h-16 text-xl font-semibold bg-[#4BEA8A] hover:bg-[#36c96b] text-[#1E1E1E] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                開始する
              </Button>
            </CardContent>
          </Card>

          {/* チケット利用カード */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-[#232323] shadow-xl h-96 w-80 flex flex-col justify-between">
            <CardHeader className="text-center pb-4 h-1/2 flex flex-col justify-center">
              <div className="mx-auto mb-6 w-24 h-24 bg-white rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border-2 border-[#4BEA8A]">
                <svg className="w-12 h-12 text-[#4BEA8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <CardTitle className="text-4xl font-bold text-white mb-2">チケット利用</CardTitle>
              <p className="text-xl text-[#4BEA8A]">チケットの確認・使用</p>
            </CardHeader>
            <CardContent className="h-1/2 flex items-end">
              <Button
                onClick={handleTicketUse}
                className="w-full h-16 text-xl font-semibold bg-[#4BEA8A] hover:bg-[#36c96b] text-[#1E1E1E] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                利用する
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* スキャナー情報とログアウトボタンを右下に表示 */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-3">
        {/* スキャナー情報 */}
        {scannerInfo && (
          <div className="bg-[#232323] rounded-xl px-4 py-3 shadow-lg border border-[#4BEA8A]/30">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#4BEA8A] rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">スキャナー: {scannerInfo.scannerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-[#4BEA8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-medium text-white">{scannerInfo.organizationName}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* ログアウトボタン */}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="px-4 py-2 text-sm text-white hover:text-[#4BEA8A] border-[#4BEA8A] hover:border-white rounded-xl bg-[#232323] shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ログアウト
        </Button>
      </div>

      {/* PWAインストールプロンプト */}
      <PWAInstallPrompt />
    </div>
  );
} 