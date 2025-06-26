'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function CompletePageContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
      {/* ロゴ */}
      <div className="w-full flex justify-center items-center pt-8 mb-8">
        <img src="/blacklogo.svg" alt="NEXANAロゴ" width={180} height={180} style={{objectFit: 'contain'}} />
      </div>
      {/* 完了メッセージのみ */}
      <div className="w-full max-w-2xl flex flex-col items-center justify-center mx-auto">
        <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-2xl flex flex-col justify-center">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl font-bold text-emerald-600 flex flex-col items-center gap-2">
              <span className="text-5xl">🎉</span>
              完了！
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      {/* ボタン */}
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

export default CompletePageContent; 