'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ScanRecord {
  id: string;
  scannedAt: string;
  profile: {
    displayName: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    department: {
      name: string;
    } | null;
  };
}

interface GetItemRecord {
  id: string;
  claimedAt: string;
}

interface ScanSession {
  id: string;
  purpose: string;
  status: string;
  records: ScanRecord[];
  getItemRecords: GetItemRecord[];
}

function CompletePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [session, setSession] = useState<ScanSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/scanner/scan-together/session?sessionId=${sessionId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        setError('セッションの取得に失敗しました');
      }
    } catch (error) {
      console.error('セッション取得エラー:', error);
      setError('セッションの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-red-600">エラー</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/scanner/dashboard')}>
              ダッシュボードに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getItemRecord = session.getItemRecords[0];

  // ユニークユーザーのみ抽出
  const uniqueRecords = session.records.filter(
    (record, index, self) =>
      index === self.findIndex(r => r.profile.user.email === record.profile.user.email)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* 中央上部のロゴ */}
      <div className="w-full flex justify-center items-center pt-8 mb-8">
        <img src="/blacklogo.svg" alt="NEXANAロゴ" width={180} height={180} style={{objectFit: 'contain'}} />
      </div>

      {/* 横並びメインコンテンツ */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-10 items-stretch justify-center mx-auto">
        {/* 完了メッセージ */}
        <Card className="flex-1 min-w-[320px] max-w-xl bg-white/80 backdrop-blur-sm border-0 shadow-2xl flex flex-col justify-center">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl font-bold text-emerald-600 flex flex-col items-center gap-2">
              <span className="text-5xl">🎉</span>
              完了！
            </CardTitle>
            <div className="mt-2">
              <span className="text-lg font-medium text-gray-700">目的: {session.purpose}</span>
            </div>
          </CardHeader>
        </Card>

        {/* 参加者一覧（ユニークのみ） */}
        <Card className="flex-1 min-w-[320px] max-w-xl bg-white/80 backdrop-blur-sm border-0 shadow-2xl flex flex-col">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              参加者一覧
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="space-y-3">
              {uniqueRecords.map((record, index) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg shadow">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{record.profile.displayName}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-xs text-gray-500">
                      {new Date(record.scannedAt).toLocaleTimeString()}
                    </p>
                    <Badge variant="default" className="mt-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow">参加済み</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ボタンは下部中央に横並びで大きく配置 */}
      <div className="flex gap-6 justify-center mt-12 w-full max-w-3xl">
        <Button onClick={() => router.push('/scanner/dashboard')}
          className="h-14 px-10 text-lg font-bold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl transition-all duration-300 flex items-center gap-2 w-1/2 min-w-[180px]">
          ダッシュボードに戻る
        </Button>
        <Button onClick={() => router.push('/scanner/scan-together/scanning')}
          variant="outline"
          className="h-14 px-10 text-lg font-bold rounded-full border-2 border-blue-400 text-blue-700 bg-white/70 hover:bg-blue-50 shadow w-1/2 min-w-[180px]">
          新しいスキャンを開始
        </Button>
      </div>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <CompletePageContent />
    </Suspense>
  );
} 