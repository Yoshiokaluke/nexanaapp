'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

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
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setScannerInfo({
            scannerName: data.scanner.name,
            organizationName: data.scanner.organizationName
          });
        } else {
          router.push('/scanner/login');
        }
      } catch (error) {
        router.push('/scanner/login');
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
      await fetch('/api/scanner/auth', {
        method: 'DELETE',
        credentials: 'include'
      });
      router.push('/scanner/login');
    } catch (error) {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">読み込み中...</p>
          <div className="mt-2 flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* ロゴを一番上の真ん中に配置 */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
        <Image src="/blacklogo.svg" alt="ロゴ" width={240} height={240} priority />
      </div>

      {/* メインコンテンツ（ロゴ分の余白を上部に追加） */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-32 p-6">
        {/* ScanTogetherとチケット利用を中央に大きく表示 */}
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-4xl">
          {/* ScanTogether カード */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/90 backdrop-blur-sm shadow-xl h-96 w-80 flex flex-col justify-between">
            <CardHeader className="text-center pb-4 h-1/2 flex flex-col justify-center">
              <div className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <CardTitle className="text-4xl font-bold text-gray-800 mb-2">ScanTogether</CardTitle>
              <p className="text-xl text-gray-600">みんなで一緒にスキャン</p>
            </CardHeader>
            <CardContent className="h-1/2 flex items-end">
              <Button
                onClick={handleScanTogether}
                className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                開始する
              </Button>
            </CardContent>
          </Card>

          {/* チケット利用カード */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/90 backdrop-blur-sm shadow-xl h-96 w-80 flex flex-col justify-between">
            <CardHeader className="text-center pb-4 h-1/2 flex flex-col justify-center">
              <div className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <CardTitle className="text-4xl font-bold text-gray-800 mb-2">チケット利用</CardTitle>
              <p className="text-xl text-gray-600">チケットの確認・使用</p>
            </CardHeader>
            <CardContent className="h-1/2 flex items-end">
              <Button
                onClick={handleTicketUse}
                className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/20">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">スキャナー: {scannerInfo.scannerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{scannerInfo.organizationName}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* ログアウトボタン */}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ログアウト
        </Button>
      </div>
    </div>
  );
} 