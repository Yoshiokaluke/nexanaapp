'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

export default function ScannerLoginPage() {
  const router = useRouter();
  const [scannerId, setScannerId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scannerId || !password) {
      setError('スキャナーIDとパスワードを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('ログイン開始:', { scannerId });
      
      const response = await fetch('/api/scanner/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scannerId, password }),
        credentials: 'include' // クッキーを含める
      });

      console.log('ログイン応答:', { status: response.status, ok: response.ok });

      const data = await response.json();
      console.log('ログインデータ:', data);

      if (response.ok) {
        // ログイン成功
        console.log('ログイン成功、ダッシュボードにリダイレクト');
        router.push('/scanner/dashboard');
      } else {
        setError(data.error || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden flex items-center justify-center p-6">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* 中央上部のロゴ */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
        <Image src="/blacklogo.svg" alt="ロゴ" width={240} height={240} priority />
      </div>

      {/* メインコンテンツ（ロゴ分の余白を上部に追加） */}
      <div className="relative z-10 w-full max-w-md pt-32">
        <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              QRスキャナー ログイン
            </CardTitle>
            <p className="text-gray-600 mt-3 text-lg">
              スキャナーIDとパスワードを入力してください
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="scannerId" className="text-sm font-semibold text-gray-700">
                  スキャナーID
                </Label>
                <Input
                  id="scannerId"
                  type="text"
                  value={scannerId}
                  onChange={(e) => setScannerId(e.target.value)}
                  placeholder="例: SCN-ABC12345"
                  className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  パスワード
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50/80 backdrop-blur-sm p-4 rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-xl font-bold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ログイン中...
                  </div>
                ) : (
                  'ログイン'
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 bg-white/50 backdrop-blur-sm p-3 rounded-xl">
                スキャナーIDとパスワードは管理者にお問い合わせください
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 