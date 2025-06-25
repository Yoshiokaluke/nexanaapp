'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Camera, CameraOff, RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import jsQR from 'jsqr';

interface ScanResult {
  success: boolean;
  message: string;
  data?: any;
}

interface ScanRecord {
  id: string;
  scannedAt: string;
  profile: {
    displayName: string;
    clerkId: string;
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

interface ScanSession {
  id: string;
  purpose: string;
  status: string;
  records: ScanRecord[];
  getItemRecords: any[];
}

function ScanningPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  // useEffectで初期化ログを1回だけ出す
  useEffect(() => {
    console.log('ScanningPage初期化:', { sessionId });
  }, [sessionId]);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastDetectedData, setLastDetectedData] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [frameCount, setFrameCount] = useState(0);
  const [session, setSession] = useState<ScanSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [lastProcessedQrData, setLastProcessedQrData] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);

  // セッション情報取得
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setIsLoadingSession(true);
      const response = await fetch(`/api/scanner/scan-together/session?sessionId=${sessionId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        console.error('セッション取得エラー:', response.status);
      }
    } catch (error) {
      console.error('セッション取得エラー:', error);
    } finally {
      setIsLoadingSession(false);
    }
  }, [sessionId]);

  // カメラ開始
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 背面カメラを優先
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        
        setDebugInfo('カメラ開始完了');
        setIsScanning(true);
        
        // ビデオの準備が完了するまで待機
        const checkVideoReady = () => {
          if (videoRef.current && videoRef.current.videoWidth && videoRef.current.videoHeight) {
            setFrameCount(0); // フレームカウントをリセット
            startQRDetection();
          } else {
            setTimeout(checkVideoReady, 100);
          }
        };
        
        checkVideoReady();
      }
    } catch (error) {
      console.error('カメラ開始エラー:', error);
      setCameraError('カメラへのアクセスに失敗しました。カメラの権限を確認してください。');
    }
  }, []);

  // カメラ停止
  const stopCamera = useCallback(() => {
    setIsScanning(false);
    frameCountRef.current = 0;
    setFrameCount(0);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // QRコードデータ処理
  const processQRCode = useCallback(async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('QRコード処理開始', { qrData: qrData?.substring(0, 50), sessionId });

    // sessionIdが存在しない場合は処理を停止
    if (!sessionId) {
      console.error('sessionIdが存在しません');
      setScanResult({
        success: false,
        message: 'セッションIDが見つかりません',
        data: { error: 'sessionId is undefined' }
      });
      setIsProcessing(false);
      return;
    }

    try {
      const requestBody = {
        qrData,
        sessionId
      };
      
      console.log('送信データ:', requestBody);
      
      const response = await fetch('/api/scanner/scan-together/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('APIレスポンス:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      });

      const result = await response.json();
      console.log('API結果:', result);

      if (response.ok) {
        setScanResult({
          success: true,
          message: 'QRコードのスキャンが完了しました',
          data: result
        });
        
        // セッション情報を最適化して更新（新しいレコードのみ追加）
        if (result.record) {
          setSession(prevSession => {
            if (!prevSession) return prevSession;
            const alreadyExists = prevSession.records.some(r => r.id === result.record.id);
            return {
              ...prevSession,
              records: alreadyExists ? prevSession.records : [result.record, ...prevSession.records]
            };
          });
        }
        
        // 0.5秒後に結果をクリアして次のスキャンに備える（2秒から短縮）
        setTimeout(() => {
          setScanResult(null);
          setLastProcessedQrData(null); // 次のスキャンのためにリセット
        }, 500);
      } else {
        setScanResult({
          success: false,
          message: result.error || 'スキャンに失敗しました',
          data: result
        });
        console.error('スキャン失敗:', result);
      }
    } catch (error) {
      console.error('API呼び出しエラー:', error);
      setScanResult({
        success: false,
        message: 'ネットワークエラーが発生しました',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, sessionId]);

  // QRコード検出処理
  const startQRDetection = useCallback(() => {
    // 既存のループがあれば停止
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    frameCountRef.current = 0;
    setFrameCount(0);

    const detectQR = () => {
      frameCountRef.current += 1;
      setFrameCount(frameCountRef.current);

      // video/canvasがreadyならQR検出
      if (
        videoRef.current &&
        canvasRef.current &&
        videoRef.current.videoWidth &&
        videoRef.current.videoHeight
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code && !isProcessing && code.data !== lastProcessedQrData) {
            console.log('QRコード検出:', { 
              data: code.data.substring(0, 50) + '...',
              dataLength: code.data.length
            });
            setLastProcessedQrData(code.data);
            processQRCode(code.data);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectQR);
    };

    detectQR();
  }, [isProcessing, lastProcessedQrData, processQRCode]);

  // コンポーネントマウント時にカメラ開始
  useEffect(() => {
    if (sessionId) {
      startCamera();
      fetchSession();
    }
    return () => {
      stopCamera();
    };
  }, [sessionId]);

  // 飲み物取得処理
  const handleGetItem = async () => {
    if (!sessionId) return;

    try {
      setIsProcessing(true);
      const response = await fetch('/api/scanner/scan-together/get-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        credentials: 'include'
      });

      const result = await response.json();
      console.log('飲み物取得レスポンス:', { status: response.status, result });

      if (response.ok) {
        console.log('飲み物取得成功:', result);
        
        // 完了画面にリダイレクト
        router.push(`/scanner/scan-together/complete?sessionId=${sessionId}`);
      } else {
        console.error('飲み物取得エラー:', { status: response.status, error: result });
        setScanResult({
          success: false,
          message: result.error || `飲み物取得に失敗しました (${response.status})`,
          data: result
        });
      }
    } catch (error) {
      console.error('飲み物取得エラー:', error);
      setScanResult({
        success: false,
        message: 'ネットワークエラーが発生しました',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // sessionが存在し、recordsが配列ならユニーク化
  const uniqueRecords = session?.records
    ? session.records.filter(
        (record, index, self) =>
          index === self.findIndex(r => r.profile.clerkId === record.profile.clerkId)
      )
    : [];

  // ユニークユーザー数を取得（clerkIdでユニーク化）
  const uniqueUserCount = session?.records
    ? new Set(session.records.map(record => record.profile.clerkId)).size
    : 0;

  // エラーハンドリング
  if (cameraError) {
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
              <CardTitle className="flex items-center justify-center gap-2 text-red-600 text-xl">
                <AlertCircle className="h-6 w-6" />
                カメラエラー
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600 text-center">{cameraError}</p>
              <div className="flex gap-3">
                <Button onClick={startCamera} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  再試行
                </Button>
                <Button 
                  onClick={() => router.back()} 
                  variant="outline"
                  className="flex-1 bg-white/50 hover:bg-white/80"
                >
                  戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* 左上の戻るボタン */}
      <div className="absolute top-8 left-8 z-20">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 bg-white/50 hover:bg-white/80 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
      </div>

      {/* 中央上部のロゴ（absoluteで重ねて表示） */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
        <Image src="/blacklogo.svg" alt="ロゴ" width={240} height={240} priority />
      </div>

      {/* メインコンテンツ（ロゴ分の余白を上部に追加） */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 space-y-8 pt-32">
        {/* カメラとスキャン記録の横並びレイアウト */}
        <div className="w-full max-w-6xl min-h-[40rem] flex flex-col lg:flex-row gap-8 items-stretch lg:items-start">
          {/* カメラビュー＋ボタン */}
          <div className="flex flex-col items-center w-full max-w-lg h-full">
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ display: 'none' }}
              />
              {/* スキャン枠 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white rounded-xl relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-blue-500 rounded-br-lg"></div>
                </div>
              </div>
              {/* 処理中インジケーター */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 flex items-center gap-4 shadow-2xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
                    <span className="text-gray-800 font-semibold text-lg">処理中...</span>
                  </div>
                </div>
              )}
            </div>
            {/* カメラ開始/停止ボタン（下中央） */}
            <div className="mt-8 flex justify-center w-full">
              <Button
                onClick={isScanning ? stopCamera : startCamera}
                size="lg"
                className="w-64 h-16 text-2xl font-bold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isScanning ? <CameraOff className="h-7 w-7" /> : <Camera className="h-7 w-7" />}
                {isScanning ? "カメラ停止" : "カメラ開始"}
              </Button>
            </div>
          </div>

          {/* スキャン記録＋セッション情報カード */}
          <Card className="w-full max-w-xl h-full bg-white/80 backdrop-blur-sm border-0 shadow-2xl lg:sticky lg:top-8 flex flex-col">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                スキャン記録 ({uniqueRecords.length}人)
              </CardTitle>
              {session && (
                <div className="mt-2">
                  <span className="text-base font-medium text-gray-700">目的: {session.purpose}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              <div className="space-y-3 flex-1 overflow-y-auto">
                {uniqueRecords.length > 0 ? (
                  uniqueRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                      <div>
                        <p className="font-semibold text-gray-800">{record.profile.displayName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(record.scannedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-8 text-gray-400 flex-1">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 border-2 border-gray-300 border-dashed rounded-full flex items-center justify-center">
                        <Camera className="h-6 w-6 text-gray-300" />
                      </div>
                      <p className="text-sm">QRコードをスキャンしてください</p>
                      <p className="text-xs mt-1">スキャンした参加者がここに表示されます</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            {/* 飲み物を取得するカードを常に表示 */}
            <div className="px-6 pb-6 pt-2 mt-auto">
              <Card className="w-full bg-white/90 backdrop-blur-sm border-0 shadow-md">
                <CardContent className="pt-6">
                  <Button 
                    onClick={handleGetItem}
                    className={`w-full h-16 text-xl font-bold rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 text-white
                      bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600
                      hover:from-emerald-500 hover:via-green-600 hover:to-emerald-700
                      disabled:bg-gradient-to-r disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed`}
                    disabled={isProcessing || uniqueUserCount < 2}
                  >
                    {isProcessing ? '処理中...' : '🍹 飲み物を取得する'}
                  </Button>
                  <p className="text-base text-gray-500 mt-4 text-center font-medium">
                    2人以上のユニークユーザーがスキャンしました
                  </p>
                </CardContent>
              </Card>
            </div>
          </Card>
        </div>

        {/* デバッグ情報 */}
        <div className="w-full max-w-lg text-xs text-gray-500 space-y-1 bg-white/30 backdrop-blur-sm rounded-xl p-4">
          <p>セッションID: {sessionId}</p>
          <p>検出回数: {detectionCount}</p>
          <p>処理フレーム数: {frameCount}</p>
          <p>フレームレート: {frameCount > 0 ? Math.round(frameCount / (Date.now() / 1000)) : 0} FPS</p>
          <p>スキャン中: {isScanning ? 'はい' : 'いいえ'}</p>
          <p>処理中: {isProcessing ? 'はい' : 'いいえ'}</p>
          {lastDetectedData && (
            <p>最後の検出データ: {lastDetectedData.substring(0, 50)}...</p>
          )}
          {debugInfo && (
            <div className="mt-2 p-2 bg-white/50 rounded-lg text-xs">
              <p className="font-medium">デバッグ情報:</p>
              <p>{debugInfo}</p>
            </div>
          )}
          <p>{uniqueRecords.length} 参加者数</p>
          <p>ユニークユーザー数: {uniqueUserCount}</p>
        </div>
      </div>
    </div>
  );
}

export default function ScanningPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScanningPageContent />
    </Suspense>
  );
} 