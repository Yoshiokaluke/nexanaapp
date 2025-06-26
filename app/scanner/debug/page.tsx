'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DebugInfo {
  environment: string;
  cookie: {
    name: string;
    exists: boolean;
  };
  session: {
    scannerId: string;
    organizationId: string;
    scannerName: string;
    organizationName: string;
    expiresAt: string;
  } | null;
  scanner: {
    id: string;
    scannerId: string;
    name: string;
    organizationId: string;
    organizationName: string;
    status: string;
  } | null;
  scanPurposes: {
    count: number;
    purposes: Array<{
      id: string;
      name: string;
      description: string;
      order: number;
    }>;
  };
}

export default function ScannerDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/scanner/debug', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data.debug);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'デバッグ情報の取得に失敗しました');
      }
    } catch (error) {
      console.error('デバッグ情報取得エラー:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">デバッグ情報を取得中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600">エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDebugInfo}>再試行</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">スキャナーセッションデバッグ</h1>
          <Button onClick={fetchDebugInfo}>更新</Button>
        </div>

        {debugInfo && (
          <>
            {/* 環境情報 */}
            <Card>
              <CardHeader>
                <CardTitle>環境情報</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>環境:</strong> {debugInfo.environment}</p>
              </CardContent>
            </Card>

            {/* クッキー情報 */}
            <Card>
              <CardHeader>
                <CardTitle>クッキー情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>名前:</strong> {debugInfo.cookie.name}</p>
                <p><strong>存在:</strong> {debugInfo.cookie.exists ? '✅ はい' : '❌ いいえ'}</p>
              </CardContent>
            </Card>

            {/* セッション情報 */}
            <Card>
              <CardHeader>
                <CardTitle>セッション情報</CardTitle>
              </CardHeader>
              <CardContent>
                {debugInfo.session ? (
                  <div className="space-y-2">
                    <p><strong>スキャナーID:</strong> {debugInfo.session.scannerId}</p>
                    <p><strong>組織ID:</strong> {debugInfo.session.organizationId}</p>
                    <p><strong>スキャナー名:</strong> {debugInfo.session.scannerName}</p>
                    <p><strong>組織名:</strong> {debugInfo.session.organizationName}</p>
                    <p><strong>有効期限:</strong> {new Date(debugInfo.session.expiresAt).toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-red-600">❌ セッションが見つかりません</p>
                )}
              </CardContent>
            </Card>

            {/* スキャナー情報 */}
            <Card>
              <CardHeader>
                <CardTitle>データベースのスキャナー情報</CardTitle>
              </CardHeader>
              <CardContent>
                {debugInfo.scanner ? (
                  <div className="space-y-2">
                    <p><strong>ID:</strong> {debugInfo.scanner.id}</p>
                    <p><strong>スキャナーID:</strong> {debugInfo.scanner.scannerId}</p>
                    <p><strong>名前:</strong> {debugInfo.scanner.name}</p>
                    <p><strong>組織ID:</strong> {debugInfo.scanner.organizationId}</p>
                    <p><strong>組織名:</strong> {debugInfo.scanner.organizationName}</p>
                    <p><strong>ステータス:</strong> {debugInfo.scanner.status}</p>
                  </div>
                ) : (
                  <p className="text-red-600">❌ スキャナー情報が見つかりません</p>
                )}
              </CardContent>
            </Card>

            {/* スキャン目的情報 */}
            <Card>
              <CardHeader>
                <CardTitle>スキャン目的情報</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>目的数:</strong> {debugInfo.scanPurposes.count}</p>
                {debugInfo.scanPurposes.count > 0 ? (
                  <div className="mt-4 space-y-2">
                    {debugInfo.scanPurposes.purposes.map((purpose) => (
                      <div key={purpose.id} className="p-3 bg-gray-50 rounded-lg">
                        <p><strong>{purpose.name}</strong> (順序: {purpose.order})</p>
                        {purpose.description && (
                          <p className="text-sm text-gray-600">{purpose.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-600">❌ スキャン目的が設定されていません</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
} 