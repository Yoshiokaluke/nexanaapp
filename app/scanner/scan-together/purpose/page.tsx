'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface ScanPurpose {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

export default function PurposeSelector() {
  const router = useRouter();
  const [purposes, setPurposes] = useState<ScanPurpose[]>([]);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPurposes();
  }, []);

  const fetchPurposes = async () => {
    try {
      const response = await fetch('/api/scanner/scan-purposes', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPurposes(data.purposes || []);
      }
    } catch (error) {
      // エラー時は何もしない
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!selectedPurpose) return;
    setIsCreating(true);
    try {
      const response = await fetch('/api/scanner/scan-together/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: selectedPurpose }),
        credentials: 'include'
      });
      if (response.ok) {
        const { sessionId } = await response.json();
        router.push(`/scanner/scan-together/scanning?sessionId=${sessionId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'セッション作成に失敗しました');
      }
    } catch (error) {
      alert('セッション作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  // ローディング画面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* 装飾的な背景要素 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-t-purple-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="mt-8 text-xl font-medium text-gray-700">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 目的がない場合
  if (purposes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* 装飾的な背景要素 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        </div>
        
        {/* 左上のロゴ */}
        <div className="absolute top-8 left-8 z-20">
          <Image src="/blacklogo.svg" alt="ロゴ" width={60} height={60} priority />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <Card className="w-full max-w-lg bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">
                スキャン目的が設定されていません
              </CardTitle>
              <p className="text-gray-600 mt-3">
                管理者がスキャン目的を設定するまでお待ちください
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => router.push('/scanner/dashboard')}
                variant="outline"
                className="w-full bg-white/50 hover:bg-white/80 transition-all duration-300"
              >
                ダッシュボードに戻る
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // メインUI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* 左上のロゴ */}
      <div className="absolute top-8 left-8 z-20">
        <Image src="/blacklogo.svg" alt="ロゴ" width={60} height={60} priority />
      </div>
      
      {/* メインコンテンツ */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-2xl">
          <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                スキャン目的を選択
              </CardTitle>
              <p className="text-gray-600 mt-3 text-lg">
                スキャンする目的を選択してください
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="purpose" className="text-lg font-medium text-gray-700">目的</Label>
                <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
                  <SelectTrigger className="h-14 text-lg bg-white/50 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                    <SelectValue placeholder="目的を選択してください" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm">
                    {purposes.map((purpose) => (
                      <SelectItem key={purpose.id} value={purpose.id} className="py-3">
                        <div>
                          <div className="font-medium text-lg">{purpose.name}</div>
                          {purpose.description && (
                            <div className="text-sm text-gray-500 mt-1">{purpose.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleNext}
                disabled={!selectedPurpose || isCreating}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? '処理中...' : '次へ進む'}
              </Button>
            </CardContent>
          </Card>
          
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => router.push('/scanner/dashboard')}
              variant="outline"
              className="bg-white/50 hover:bg-white/80 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 px-8 py-3"
            >
              ダッシュボードに戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 