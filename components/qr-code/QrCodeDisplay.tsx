'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/nextjs';

interface QrCodeDisplayProps {
  organizationProfileId: string;
  displayName?: string;
  organizationName?: string;
  departmentName?: string;
  className?: string;
}

export function QrCodeDisplay({
  organizationProfileId,
  displayName,
  organizationName,
  departmentName,
  className
}: QrCodeDisplayProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false); // リクエスト中フラグ

  const loadQrCode = async () => {
    // 既にリクエスト中の場合はスキップ
    if (isRequesting) {
      console.log('リクエスト中です。スキップします。');
      return;
    }

    try {
      setIsRequesting(true);
      setIsLoading(true);
      setError(null);
      
      console.log('QRコード読み込み開始:', { organizationProfileId, isLoaded, isSignedIn });
      
      // 認証が完了していない場合は待機
      if (!isLoaded || !isSignedIn) {
        console.log('認証が完了していません。待機中...');
        return;
      }
      
      // 認証トークンを取得
      const token = await getToken();
      
      // APIエンドポイントを使用してQRコードを取得
      const response = await fetch('/api/qr-code/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationProfileId,
        }),
      });

      console.log('QRコードAPI応答:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('QRコードAPIエラー:', errorData);
        throw new Error(errorData.error || `QRコードの取得に失敗しました (${response.status})`);
      }

      const data = await response.json();
      console.log('QRコードAPI成功:', { success: data.success, hasImage: !!data.qrCode?.qrCodeImage });
      
      if (data.success && data.qrCode.qrCodeImage) {
        setQrCodeImage(data.qrCode.qrCodeImage);
        
        // 有効期限から残り時間を計算
        const expiresAt = new Date(data.qrCode.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setRemainingTime(remaining);
        
        console.log('QRコード設定完了:', { remainingTime: remaining });
      } else {
        throw new Error('QRコード画像の取得に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'QRコードの読み込みに失敗しました';
      setError(errorMessage);
      console.error('QRコード読み込みエラー:', err);
    } finally {
      setIsLoading(false);
      setIsRequesting(false);
    }
  };

  const refreshQrCode = async () => {
    await loadQrCode();
  };

  // 初回読み込み
  useEffect(() => {
    if (organizationProfileId && isLoaded && isSignedIn && !isRequesting) {
      loadQrCode();
    }
  }, [organizationProfileId, isLoaded, isSignedIn]);

  // 認証状態が変更された時の再読み込み（エラー時のみ）
  useEffect(() => {
    if (isLoaded && isSignedIn && organizationProfileId && !isLoading && error && !isRequesting) {
      // 認証完了後にエラーがある場合は少し待ってから再試行
      const timer = setTimeout(() => {
        if (!isRequesting) {
          loadQrCode();
        }
      }, 2000); // 2秒後に再試行

      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, organizationProfileId, isLoading, error]);

  // 残り時間のカウントダウン
  useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          // 期限切れになったら自動更新
          loadQrCode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">QRコードを生成中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refreshQrCode} variant="outline">
              再試行
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">QRコード</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={remainingTime > 60 ? "default" : "destructive"}>
            残り時間: {formatTime(remainingTime)}
          </Badge>
          <Button 
            onClick={refreshQrCode} 
            variant="outline" 
            size="sm"
            disabled={remainingTime > 60}
          >
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-center">
        {qrCodeImage && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img 
                src={qrCodeImage} 
                alt="QR Code" 
                className="w-48 h-48 border rounded-lg"
              />
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              {displayName && (
                <p><strong>名前:</strong> {displayName}</p>
              )}
              {organizationName && (
                <p><strong>組織:</strong> {organizationName}</p>
              )}
              {departmentName && (
                <p><strong>部署:</strong> {departmentName}</p>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              このQRコードは5分間有効です
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 