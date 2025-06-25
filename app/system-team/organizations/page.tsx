'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Dialog } from '@headlessui/react';
import { SignOutButton } from '@clerk/nextjs';

type Organization = {
  id: string;
  name: string;
  address: string | null;
  managerName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type QrScanner = {
  id: string;
  name: string;
  description: string | null;
  location: string;
  scannerId: string;
  password: string;
  status: string;
  lastActive: Date | null;
  organizationId: string;
};

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [qrScanners, setQrScanners] = useState<Record<string, QrScanner[]>>({});
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQrScannerModalOpen, setIsQrScannerModalOpen] = useState(false);
  const [isEditQrScannerModalOpen, setIsEditQrScannerModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [editingQrScanner, setEditingQrScanner] = useState<QrScanner | null>(null);
  const [newQrScanner, setNewQrScanner] = useState({
    name: '',
    description: '',
    location: '',
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // 組織一覧の取得
  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/system-team/organizations');
      const data = await response.json();
      setOrganizations(Array.isArray(data) ? data : []);
      
      // 組織一覧取得後に各組織のQRスキャナーを取得
      data.forEach((org: Organization) => {
        fetchQrScanners(org.id);
      });
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  // QRスキャナー一覧の取得
  const fetchQrScanners = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/system-team/qr-scanners?organizationId=${organizationId}`);
      const data = await response.json();
      setQrScanners(prev => ({
        ...prev,
        [organizationId]: data,
      }));
    } catch (error) {
      console.error('Error fetching QR scanners:', error);
    }
  };

  // QRスキャナーの作成
  const handleCreateQrScanner = async () => {
    if (!selectedOrgId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/system-team/qr-scanners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          ...newQrScanner,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('QRスキャナー作成エラー詳細:', errorData);
        throw new Error(errorData.error || 'QRスキャナーの作成に失敗しました');
      }

      await fetchQrScanners(selectedOrgId);
      setIsQrScannerModalOpen(false);
      setNewQrScanner({
        name: '',
        description: '',
        location: '',
      });
    } catch (error) {
      console.error('Error details:', error);
      alert(error instanceof Error ? error.message : 'QRスキャナーの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // QRスキャナーの削除
  const handleDeleteQrScanner = async (id: string, organizationId: string) => {
    if (!confirm('このQRスキャナーを削除してもよろしいですか？')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/system-team/qr-scanners?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('QRスキャナーの削除に失敗しました');

      await fetchQrScanners(organizationId);
    } catch (error) {
      console.error('Error:', error);
      alert('QRスキャナーの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // QRスキャナーのステータス更新
  const handleUpdateQrScannerStatus = async (id: string, organizationId: string, currentStatus: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system-team/qr-scanners', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status: currentStatus === 'active' ? 'inactive' : 'active',
        }),
      });

      if (!response.ok) throw new Error('QRスキャナーの更新に失敗しました');

      await fetchQrScanners(organizationId);
    } catch (error) {
      console.error('Error:', error);
      alert('QRスキャナーの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 組織の削除
  const handleDelete = async (id: string) => {
    if (!confirm('この組織を削除してもよろしいですか？')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/system-team/organizations?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('組織の削除に失敗しました');
      
      await fetchOrganizations();
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('組織の削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 組織の編集
  const handleEditOrganization = async () => {
    if (!editingOrg) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/system-team/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingOrg.id,
          name: editingOrg.name,
          address: editingOrg.address,
          managerName: editingOrg.managerName,
        }),
      });

      if (!response.ok) throw new Error('組織の更新に失敗しました');
      
      await fetchOrganizations();
      setIsEditOrgModalOpen(false);
      setEditingOrg(null);
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('組織の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // QRスキャナーの編集
  const handleEditQrScanner = async () => {
    if (!editingQrScanner) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/system-team/qr-scanners', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingQrScanner.id,
          name: editingQrScanner.name,
          description: editingQrScanner.description,
          location: editingQrScanner.location,
        }),
      });

      if (!response.ok) throw new Error('QRスキャナーの更新に失敗しました');

      await fetchQrScanners(editingQrScanner.organizationId);
      setIsEditQrScannerModalOpen(false);
      setEditingQrScanner(null);
    } catch (error) {
      console.error('Error:', error);
      alert('QRスキャナーの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // パスワードの変更
  const handleUpdatePassword = async () => {
    if (!editingQrScanner) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/system-team/qr-scanners', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingQrScanner.id,
          password: newPassword,
        }),
      });

      if (!response.ok) throw new Error('パスワードの変更に失敗しました');

      await fetchQrScanners(editingQrScanner.organizationId);
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setEditingQrScanner(null);
    } catch (error) {
      console.error('Error:', error);
      alert('パスワードの変更に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ヒーローバー */}
      <section className="w-full bg-white h-[100px] flex items-center justify-between shadow-sm border-b border-gray-100 mb-10 px-8">
        <img src="/blacklogo.svg" alt="ロゴ" className="h-16 w-auto" />
        <SignOutButton>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-base font-semibold shadow transition-colors">
            ログアウト
          </button>
        </SignOutButton>
      </section>
      {/* システム管理タイトル */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {/* Cogアイコン（Heroicons） */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 tracking-wide">システム管理</h2>
      </div>
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex justify-end mb-8">
          <Link
            href="/system-team/organizations/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-base font-semibold shadow transition-colors"
          >
            新規作成
          </Link>
        </div>
        <div className="grid gap-8">
          {organizations.map((org) => (
            <div key={org.id} className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Link href={`/organization/${org.id}/admin-toppage`} className="text-2xl font-bold text-blue-700 hover:underline">
                    {org.name}
                  </Link>
                  <p className="text-gray-500 mt-2 text-base">{org.address || '住所未設定'}</p>
                  <p className="text-gray-500 text-base">{org.managerName || '管理者名未設定'}</p>
                </div>
                <div className="flex flex-col gap-2 min-w-[160px] items-end">
                  <button
                    onClick={() => {
                      setEditingOrg(org);
                      setIsEditOrgModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 text-base font-semibold shadow transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrgId(org.id);
                      setIsQrScannerModalOpen(true);
                      if (!qrScanners[org.id]) {
                        fetchQrScanners(org.id);
                      }
                    }}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg px-5 py-2 text-base font-semibold shadow transition-colors border border-blue-200"
                  >
                    QRスキャナーを追加
                  </button>
                  <button
                    onClick={() => handleDelete(org.id)}
                    className="bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg px-5 py-2 text-base font-semibold shadow transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
              {/* QRスキャナー一覧 */}
              {qrScanners[org.id] && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">QRスキャナー一覧</h3>
                  <div className="grid gap-4">
                    {qrScanners[org.id].map((scanner) => (
                      <div key={scanner.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{scanner.name}</p>
                          <p className="text-sm text-gray-500">{scanner.location}</p>
                          <p className="text-xs text-gray-400">ID: {scanner.scannerId}</p>
                          <p className="text-xs text-gray-400">パスワード: {scanner.password}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingQrScanner(scanner);
                              setIsEditQrScannerModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1 text-sm font-semibold shadow transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => {
                              setEditingQrScanner(scanner);
                              setIsPasswordModalOpen(true);
                            }}
                            className="bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-lg px-4 py-1 text-sm font-semibold shadow transition-colors border border-gray-200"
                          >
                            パスワード変更
                          </button>
                          <button
                            onClick={() => handleUpdateQrScannerStatus(scanner.id, org.id, scanner.status)}
                            className={`rounded-lg px-4 py-1 text-sm font-semibold shadow transition-colors border ${
                              scanner.status === 'active'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-gray-200'
                            }`}
                          >
                            {scanner.status === 'active' ? '有効' : '無効'}
                          </button>
                          <button
                            onClick={() => handleDeleteQrScanner(scanner.id, org.id)}
                            className="bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg px-4 py-1 text-sm font-semibold shadow transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 組織編集モーダル */}
        <Dialog
          open={isEditOrgModalOpen}
          onClose={() => setIsEditOrgModalOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-xl w-full rounded-2xl bg-white p-8 shadow-2xl">
              <Dialog.Title className="text-2xl font-bold mb-8">
                組織の編集
              </Dialog.Title>
              <div className="space-y-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    組織名 *
                  </label>
                  <input
                    type="text"
                    value={editingOrg?.name || ''}
                    onChange={(e) =>
                      setEditingOrg(prev => prev ? { ...prev, name: e.target.value } : null)
                    }
                    className="block w-full h-12 text-lg rounded-lg border border-gray-300 px-4 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    住所
                  </label>
                  <input
                    type="text"
                    value={editingOrg?.address || ''}
                    onChange={(e) =>
                      setEditingOrg(prev => prev ? { ...prev, address: e.target.value } : null)
                    }
                    className="block w-full h-12 text-lg rounded-lg border border-gray-300 px-4 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    管理者名
                  </label>
                  <input
                    type="text"
                    value={editingOrg?.managerName || ''}
                    onChange={(e) =>
                      setEditingOrg(prev => prev ? { ...prev, managerName: e.target.value } : null)
                    }
                    className="block w-full h-12 text-lg rounded-lg border border-gray-300 px-4 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="mt-10 flex justify-end gap-6">
                <button
                  onClick={() => {
                    setIsEditOrgModalOpen(false);
                    setEditingOrg(null);
                  }}
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleEditOrganization}
                  disabled={isLoading || !editingOrg?.name}
                  className="px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? '更新中...' : '更新'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* QRスキャナー作成モーダル */}
        <Dialog
          open={isQrScannerModalOpen}
          onClose={() => setIsQrScannerModalOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium mb-4">
                QRスキャナーの追加
              </Dialog.Title>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    名前
                  </label>
                  <input
                    type="text"
                    value={newQrScanner.name}
                    onChange={(e) =>
                      setNewQrScanner({ ...newQrScanner, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    説明
                  </label>
                  <input
                    type="text"
                    value={newQrScanner.description}
                    onChange={(e) =>
                      setNewQrScanner({ ...newQrScanner, description: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    設置場所
                  </label>
                  <input
                    type="text"
                    value={newQrScanner.location}
                    onChange={(e) =>
                      setNewQrScanner({ ...newQrScanner, location: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsQrScannerModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreateQrScanner}
                  disabled={isLoading || !newQrScanner.name || !newQrScanner.location}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? '作成中...' : '作成'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* QRスキャナー編集モーダル */}
        <Dialog
          open={isEditQrScannerModalOpen}
          onClose={() => setIsEditQrScannerModalOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium mb-4">
                QRスキャナーの編集
              </Dialog.Title>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    名前
                  </label>
                  <input
                    type="text"
                    value={editingQrScanner?.name || ''}
                    onChange={(e) =>
                      setEditingQrScanner(prev => prev ? { ...prev, name: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    説明
                  </label>
                  <input
                    type="text"
                    value={editingQrScanner?.description || ''}
                    onChange={(e) =>
                      setEditingQrScanner(prev => prev ? { ...prev, description: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    設置場所
                  </label>
                  <input
                    type="text"
                    value={editingQrScanner?.location || ''}
                    onChange={(e) =>
                      setEditingQrScanner(prev => prev ? { ...prev, location: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditQrScannerModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleEditQrScanner}
                  disabled={isLoading || !editingQrScanner?.name || !editingQrScanner?.location}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? '更新中...' : '更新'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* パスワード変更モーダル */}
        <Dialog
          open={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium mb-4">
                パスワードの変更
              </Dialog.Title>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    新しいパスワード
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpdatePassword}
                  disabled={isLoading || !newPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? '更新中...' : '更新'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </>
  );
}