'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

function CompletePageContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: '#1E1E1E' }}>
      {/* ロゴ */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30 cursor-pointer" onClick={() => router.push('/scanner/dashboard')}>
        <Image 
          src="/White.w.logo.svg" 
          alt="Logo" 
          width={240} 
          height={72}
          className="hover:opacity-80 transition-opacity"
        />
      </div>
      
      {/* 光の演出（グリーン系） */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[420px] h-[220px] bg-[#4BEA8A]/20 rounded-full blur-2xl opacity-60 animate-pulse" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#4BEA8A]/10 rounded-full blur-3xl opacity-40" />
      </div>
      {/* ビールアイコンとCONGRATULATIONS */}
      <div className="relative flex flex-col items-center z-20 mb-8">
        <div className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg tracking-widest mb-2" style={{letterSpacing: '0.1em'}}>CONGRATULATIONS</div>
        <div className="animate-bounce-slow">
          {/* ビールアイコン */}
          <Image 
            src="/beers.svg" 
            alt="Beers" 
            width={180} 
            height={140}
            className="drop-shadow-lg"
          />
        </div>
      </div>
      {/* 景品ゲットラベル */}
      <div className="text-white text-4xl md:text-5xl font-extrabold drop-shadow-2xl bg-[#4BEA8A] px-10 py-4 rounded-2xl mb-6 text-center z-20 border-4 border-white/40 shadow-xl animate-pop">ドリンクゲット!</div>
      {/* メッセージ */}
      <div className="text-center mb-8 z-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow">冷蔵庫からお好きなドリンクをゲットできます！</h2>
      </div>
      {/* ボタン */}
      <div className="flex gap-6 justify-center mt-8 w-full max-w-3xl z-20">
        <Button onClick={() => router.push('/scanner/dashboard')}
          className="h-14 px-10 text-lg font-bold rounded-full bg-[#4BEA8A] hover:bg-[#36c96b] text-[#1E1E1E] shadow-xl transition-all duration-300 flex items-center gap-2 w-1/2 min-w-[180px]">
          ダッシュボードに戻る
        </Button>
        <Button onClick={() => router.push('/scanner/scan-together/scanning')}
          variant="outline"
          className="h-14 px-10 text-lg font-bold rounded-full border-2 border-[#4BEA8A] text-[#4BEA8A] bg-[#232323] hover:bg-[#333] shadow w-1/2 min-w-[180px]">
          新しいスキャンを開始
        </Button>
      </div>
      {/* 紙吹雪アニメーション（グリーン・白系） */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="confetti confetti1" />
        <div className="confetti confetti2" />
        <div className="confetti confetti3" />
      </div>
      <style jsx>{`
        .animate-bounce-slow {
          animation: bounce 1.6s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-24px); }
        }
        .animate-pop {
          animation: pop 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes pop {
          0% { transform: scale(0.7); opacity: 0; }
          80% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .confetti {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          opacity: 0.7;
          pointer-events: none;
        }
        .confetti1 {
          top: 10%; left: 20%; background: #4BEA8A; animation: confetti-fall 2.5s infinite linear;
        }
        .confetti2 {
          top: 20%; left: 60%; background: #fff; animation: confetti-fall 2.2s 0.5s infinite linear;
        }
        .confetti3 {
          top: 5%; left: 80%; background: #4BEA8A; animation: confetti-fall 2.8s 1s infinite linear;
        }
        @keyframes confetti-fall {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          80% { opacity: 1; }
          100% { transform: translateY(600px) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default CompletePageContent; 