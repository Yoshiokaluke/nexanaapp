'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import Link from 'next/link';

interface ScanPurpose {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
        // 優先順位順（order）でソートし、最大6個まで表示
        const sortedPurposes = (data.purposes || [])
          .sort((a: ScanPurpose, b: ScanPurpose) => a.order - b.order)
          .slice(0, 6);
        setPurposes(sortedPurposes);
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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: '#1E1E1E' }}>
        {/* ロゴ */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto cursor-pointer">
          <Link href="/scanner/dashboard">
            <Image src="/White.w.logo.svg" alt="ロゴ" width={240} height={240} priority />
          </Link>
        </div>
        <div className="text-center z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-[#4BEA8A]/30 border-t-[#4BEA8A] mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-t-white animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-8 text-xl font-medium text-white">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 目的がない場合
  if (purposes.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: '#1E1E1E' }}>
        {/* ロゴ */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto cursor-pointer">
          <Link href="/scanner/dashboard">
            <Image src="/White.w.logo.svg" alt="ロゴ" width={240} height={240} priority />
          </Link>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <Card className="w-full max-w-lg bg-[#232323] border border-[#4BEA8A]/30 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-white">
                スキャン目的が設定されていません
              </CardTitle>
              <p className="text-[#4BEA8A] mt-3">
                管理者がスキャン目的を設定するまでお待ちください
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => router.push('/scanner/dashboard')}
                variant="outline"
                className="w-full bg-[#232323] border-2 border-[#4BEA8A] text-[#4BEA8A] hover:bg-[#333] transition-all duration-300"
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: '#1E1E1E' }}>
      {/* ロゴ */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto cursor-pointer">
        <Link href="/scanner/dashboard">
          <Image src="/White.w.logo.svg" alt="ロゴ" width={240} height={240} priority />
        </Link>
      </div>
      {/* メインコンテンツ */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 w-full">
        <div className="w-full max-w-4xl">
          <Card className="w-full bg-[#232323] border border-[#4BEA8A]/30 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-4xl font-bold text-white">
                スキャン目的を選択
              </CardTitle>
              <p className="text-[#4BEA8A] mt-3 text-lg">
                スキャンする目的を選択してください
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {purposes.map((purpose) => (
                    <Card
                      key={purpose.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                        selectedPurpose === purpose.id
                          ? 'ring-2 ring-[#4BEA8A] bg-[#232323] border-[#4BEA8A]'
                          : 'bg-[#232323] hover:bg-[#333] border-[#4BEA8A]/30'
                      }`}
                      onClick={() => setSelectedPurpose(purpose.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">
                              {purpose.name}
                            </h3>
                            {purpose.description && (
                              <p className="text-sm text-[#4BEA8A] leading-relaxed">
                                {purpose.description}
                              </p>
                            )}
                          </div>
                          {selectedPurpose === purpose.id && (
                            <div className="ml-3">
                              <svg className="w-6 h-6 text-[#4BEA8A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleNext}
                disabled={!selectedPurpose || isCreating}
                className="w-full h-14 text-lg font-semibold bg-[#4BEA8A] hover:bg-[#36c96b] text-[#1E1E1E] shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? '処理中...' : '次へ進む'}
              </Button>
            </CardContent>
          </Card>
          
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => router.push('/scanner/dashboard')}
              variant="outline"
              className="bg-[#232323] border-2 border-[#4BEA8A] text-[#4BEA8A] hover:bg-[#333] transition-all duration-300 px-8 py-3"
            >
              ダッシュボードに戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 