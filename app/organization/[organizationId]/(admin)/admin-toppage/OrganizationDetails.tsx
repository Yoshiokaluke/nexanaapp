'use client';

import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type QrScanner = {
  id: string;
  name: string;
  location: string;
  scannerId: string;
  password: string;
  status: string;
  lastActive: Date | null;
  description: string | null;
};

type Organization = {
  id: string;
  name: string;
  address: string | null;
  managerName: string | null;
  _count: {
    memberships: number;
    qrScanners: number;
  };
  qrScanners: QrScanner[];
};

interface OrganizationDetailsProps {
  organization: Organization;
}

export default function OrganizationDetails({ organization }: OrganizationDetailsProps) {
  const params = useParams();
  const organizationId = params.organizationId as string;

  const formatDate = (date: Date | null) => {
    if (!date) return '未使用';
    return new Date(date).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">有効</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">無効</Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* ヘッダーセクション */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {organization.name}
        </h1>
        <p className="text-gray-600 text-lg">組織の詳細情報とQRスキャナー管理</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              メンバー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{organization._count.memberships}</div>
            <p className="text-gray-600 text-sm">登録済みメンバー</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
              </svg>
              QRスキャナー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{organization._count.qrScanners}</div>
            <p className="text-gray-600 text-sm">設置済みスキャナー</p>
          </CardContent>
        </Card>
      </div>

      {/* 組織基本情報 */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            組織基本情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">組織名</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{organization.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">担当者名</label>
              <p className="mt-1 text-lg text-gray-900">{organization.managerName || '未設定'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">住所</label>
              <p className="mt-1 text-lg text-gray-900">{organization.address || '未設定'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QRスキャナー一覧 */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
            </svg>
            QRスキャナー一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organization.qrScanners.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">QRスキャナーがありません</h3>
              <p className="mt-1 text-sm text-gray-500">新しいQRスキャナーを追加してください。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {organization.qrScanners.map((scanner) => (
                <Card key={scanner.id} className="border border-gray-200 hover:border-indigo-300 transition-colors duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">{scanner.name}</CardTitle>
                      {getStatusBadge(scanner.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500 font-medium">設置場所</label>
                        <p className="text-gray-900">{scanner.location}</p>
                      </div>
                      <div>
                        <label className="text-gray-500 font-medium">スキャナーID</label>
                        <p className="text-gray-900 font-mono">{scanner.scannerId}</p>
                      </div>
                      <div>
                        <label className="text-gray-500 font-medium">パスワード</label>
                        <p className="text-gray-900 font-mono">{scanner.password}</p>
                      </div>
                      <div>
                        <label className="text-gray-500 font-medium">最終アクセス</label>
                        <p className="text-gray-900">{formatDate(scanner.lastActive)}</p>
                      </div>
                    </div>
                    {scanner.description && (
                      <div>
                        <label className="text-gray-500 font-medium text-sm">説明</label>
                        <p className="text-gray-900 text-sm">{scanner.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 