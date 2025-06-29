'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Camera, CameraOff, RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import jsQR from 'jsqr';
import Link from 'next/link';

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
    
    // 5分後に自動的にダッシュボードに遷移
    const timer = setTimeout(() => {
      console.log('5分経過、ダッシュボードに自動遷移');
      router.push('/scanner/dashboard');
    }, 5 * 60 * 1000); // 5分 = 300秒 = 300,000ミリ秒
    
    // クリーンアップ関数でタイマーをクリア
    return () => {
      clearTimeout(timer);
    };
  }, [sessionId, router]);
  
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
  const scannedQrSet = useRef<Set<string>>(new Set());

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

  // カメラ権限の確認とリクエスト
  const checkCameraPermission = useCallback(async () => {
    try {
      // カメラ権限の状態を確認
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log('カメラ権限状態:', permission.state);
      
      if (permission.state === 'denied') {
        setCameraError('カメラの権限が拒否されています。ブラウザの設定でカメラ権限を許可してください。');
        return false;
      }
      
      if (permission.state === 'prompt') {
        console.log('カメラ権限のリクエストが必要です');
      }
      
      return true;
    } catch (error) {
      console.log('権限確認エラー（無視可能）:', error);
      return true; // 権限APIが利用できない場合は続行
    }
  }, []);

  // カメラ開始
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      // カメラ権限を確認
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        return;
      }
      
      // 利用可能なカメラデバイスを取得
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('利用可能なカメラデバイス:', videoDevices.map(d => ({ id: d.deviceId, label: d.label })));
      
      // カメラ制約の設定
      let constraints: any = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      };
      
      // 内カメラを優先的に選択
      let preferredDeviceId = null;
      
      // デバイスラベルから内カメラを特定
      const frontCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('front') ||
        device.label.toLowerCase().includes('user') ||
        device.label.toLowerCase().includes('内') ||
        device.label.toLowerCase().includes('フロント')
      );
      
      if (frontCamera) {
        preferredDeviceId = frontCamera.deviceId;
        console.log('内カメラを検出:', frontCamera.label);
      }
      
      // 内カメラが見つかった場合は明示的に指定
      if (preferredDeviceId) {
        constraints.video = {
          ...constraints.video,
          deviceId: { exact: preferredDeviceId }
        };
      } else {
        // 内カメラが見つからない場合はfacingModeを使用
        constraints.video = {
          ...constraints.video,
          facingMode: 'user'
        };
      }
      
      console.log('カメラ制約:', constraints);
      
      // カメラアクセスを試行
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        
        setDebugInfo(`カメラ開始完了 - デバイス数: ${videoDevices.length}`);
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
      
      // より詳細なエラーメッセージを提供
      let errorMessage = 'カメラへのアクセスに失敗しました。';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'カメラの権限が拒否されました。ブラウザの設定でカメラ権限を許可してください。';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'カメラが見つかりません。デバイスにカメラが接続されているか確認してください。';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'カメラが他のアプリケーションで使用中です。他のアプリを閉じてから再試行してください。';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = '要求されたカメラ設定が利用できません。別のカメラを試してください。';
        }
      }
      
      setCameraError(errorMessage);
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

  // Web Audio APIでレジのような「ぴっ」音を鳴らす関数
  function playBeep() {
    if (typeof window === 'undefined') return;
    const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'square'; // レジのような音
    osc.frequency.value = 1200; // 高めの音
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08); // 0.08秒だけ鳴らす
    osc.onended = () => ctx.close();
  }

  // Thank you効果音（上昇アルペジオ）
  function playThankYouSound() {
    if (typeof window === 'undefined') return;
    const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.10);
      osc.onended = () => osc.disconnect();
    });
    setTimeout(() => ctx.close(), 500);
  }

  // QRコードデータ処理
  const processQRCode = useCallback(async (qrData: string) => {
    // すでに認識済みなら何もしない
    if (scannedQrSet.current.has(qrData)) return;

    // ここで音を鳴らす
    playBeep();

    // 認識済みとして記録
    scannedQrSet.current.add(qrData);

    setIsProcessing(true);
    if (!qrData || qrData.trim() === '') {
      setIsProcessing(false);
      return;
    }
    if (qrData === lastProcessedQrData) {
      setIsProcessing(false);
      return;
    }
    setLastProcessedQrData(qrData);
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
        // スキャン成功時に記録
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
        
        // 0.5秒後に結果とlastProcessedQrDataをクリア
        setTimeout(() => {
          setScanResult(null);
          setLastProcessedQrData(null);
        }, 500);
      } else {
        // エラーメッセージを詳細に取得
        let errorMessage = `飲み物取得に失敗しました (${response.status})`;
        if (result?.error) {
          errorMessage = result.error;
        } else if (result?.details) {
          errorMessage = result.details;
        } else if (result?.message) {
          errorMessage = result.message;
        } else if (typeof result === 'object' && Object.keys(result).length === 0) {
          errorMessage = 'サーバーから空のレスポンスが返されました';
        }
        
        console.error('飲み物取得エラー:', { status: response.status, error: result, errorMessage });
        setScanResult({
          success: false,
          message: errorMessage,
          data: result
        });
        // 「既にスキャン済みです」など特定エラー時も同様に0.5秒間はlastProcessedQrDataを維持
        if (errorMessage.includes('既にスキャン済み')) {
          setTimeout(() => {
            setScanResult(null);
            setLastProcessedQrData(null);
          }, 500);
        }
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
            processQRCode(code.data);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectQR);
    };

    detectQR();
  }, [processQRCode]);

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
    if (!sessionId || isProcessing) return;
    setIsProcessing(true);

    // カメラを停止
    stopCamera();

    try {
      const response = await fetch('/api/scanner/scan-together/get-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        credentials: 'include'
      });

      const result = await response.json();
      console.log('飲み物取得レスポンス:', { status: response.status, result });

      if (response.ok && result.success) {
        playThankYouSound();
        router.push(`/scanner/scan-together/complete?sessionId=${sessionId}`);
        return;
      } else {
        setIsProcessing(false);
        let errorMessage = result?.error || result?.message || `飲み物取得に失敗しました (${response.status})`;
        setScanResult({
          success: false,
          message: errorMessage,
          data: result
        });
        console.error('飲み物取得エラー:', result);
      }
    } catch (error) {
      setIsProcessing(false);
      setScanResult({
        success: false,
        message: 'ネットワークエラーが発生しました',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.error('飲み物取得エラー:', error);
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#1E1E1E' }}>
      {/* 装飾的な背景要素（グリーンの光） */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#4BEA8A]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#4BEA8A]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#4BEA8A]/10 rounded-full blur-3xl"></div>
      </div>
      {/* 左上の戻るボタン */}
      <div className="absolute top-8 left-8 z-20">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 bg-[#232323] hover:bg-[#333] text-white border border-[#4BEA8A]"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
      </div>
      {/* 中央上部のロゴ（absoluteで重ねて表示） */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto cursor-pointer">
        <Link href="/scanner/dashboard">
          <Image src="/White.w.logo.svg" alt="ロゴ" width={240} height={240} priority />
        </Link>
      </div>
      {/* メインコンテンツ（ロゴ分の余白を上部に追加） */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 space-y-8 pt-32">
        {/* カメラとスキャン記録の横並びレイアウト */}
        <div className="w-full max-w-6xl min-h-[40rem] flex flex-col lg:flex-row gap-8 items-stretch lg:items-start">
          {/* カメラビュー＋ボタン */}
          <div className="flex flex-col items-center w-full max-w-lg h-full">
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-[#4BEA8A]/30">
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
                <div className="w-64 h-64 border-2 border-[#4BEA8A] rounded-xl relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#4BEA8A] rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#4BEA8A] rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#4BEA8A] rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#4BEA8A] rounded-br-lg"></div>
                </div>
              </div>
              {/* 処理中インジケーター（カメラを塞ぐ） */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-[#232323] rounded-2xl p-6 flex items-center gap-4 shadow-2xl border border-[#4BEA8A]/30">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#4BEA8A]/30 border-t-[#4BEA8A]"></div>
                    <span className="text-white font-semibold text-lg">処理中...</span>
                  </div>
                </div>
              )}
            </div>
            {/* カメラ開始/停止ボタン（下中央） */}
            <div className="mt-8 flex justify-center w-full">
              <Button
                onClick={isScanning ? stopCamera : startCamera}
                size="lg"
                className="w-64 h-16 text-2xl font-bold rounded-full bg-[#4BEA8A] hover:bg-[#36c96b] text-[#1E1E1E] shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isScanning ? <CameraOff className="h-7 w-7" /> : <Camera className="h-7 w-7" />}
                {isScanning ? "カメラ停止" : "カメラ開始"}
              </Button>
            </div>
          </div>

          {/* スキャン記録＋セッション情報カード */}
          <Card className="w-full max-w-xl h-full bg-[#232323] border border-[#4BEA8A]/30 shadow-2xl lg:sticky lg:top-8 flex flex-col">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold text-white">
                スキャン記録 ({uniqueRecords.length}人)
              </CardTitle>
              {session && (
                <div className="mt-2">
                  <span className="text-base font-medium text-[#4BEA8A]">目的: {session.purpose}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              <div className="space-y-3 flex-1 overflow-y-auto">
                {uniqueRecords.length > 0 ? (
                  uniqueRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-[#232323] rounded-xl border border-[#4BEA8A]/20">
                      <div>
                        <p className="font-semibold text-white">{record.profile.displayName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#4BEA8A]">
                          {new Date(record.scannedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-8 text-[#4BEA8A]/60 flex-1">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 border-2 border-[#4BEA8A]/40 border-dashed rounded-full flex items-center justify-center">
                        <Camera className="h-6 w-6 text-[#4BEA8A]/40" />
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
              <Card className="w-full bg-[#1E1E1E] border border-[#4BEA8A]/30 shadow-md">
                <CardContent className="pt-6">
                  <Button
                    onClick={handleGetItem}
                    disabled={isProcessing || uniqueUserCount < 2}
                    className={`w-full h-16 text-xl font-bold rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 text-white
                      bg-[#4BEA8A] hover:bg-[#36c96b] text-[#1E1E1E]
                      disabled:bg-[#232323] disabled:text-[#4BEA8A]/40 disabled:shadow-none disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? '処理中...' : '🍹 飲み物を取得する'}
                  </Button>
                  <p className="text-base text-[#4BEA8A] mt-4 text-center font-medium">
                    2人以上のユニークユーザーがスキャンしました
                  </p>
                </CardContent>
              </Card>
            </div>
          </Card>
        </div>

        {/* デバッグ情報 */}
        <div className="w-full max-w-lg text-xs text-[#4BEA8A]/80 space-y-1 bg-[#232323] rounded-xl p-4">
          <p>セッションID: {sessionId}</p>
          <p>検出回数: {detectionCount}</p>
          <p>処理フレーム数: {frameCount}</p>
          <p>フレームレート: {frameCount > 0 ? Math.round(frameCount / (Date.now() / 1000)) : 0} FPS</p>
          <p>スキャン中: {isScanning ? 'はい' : 'いいえ'}</p>
          <p>処理中: {isProcessing ? 'はい' : 'いいえ'}</p>
          <p>カメラ: 内カメラ（フロントカメラ）</p>
          {lastDetectedData && (
            <p>最後の検出データ: {lastDetectedData.substring(0, 50)}...</p>
          )}
          {debugInfo && (
            <div className="mt-2 p-2 bg-[#1E1E1E] rounded-lg text-xs">
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