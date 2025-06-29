'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* ヘッダー */}
      <header className="w-full bg-[#232323] h-[80px] flex items-center justify-between px-8 border-b border-[#4BEA8A]/30 shadow-lg">
        <div className="flex items-center gap-4">
          <img src="/White.w.logo.svg" alt="NEXANAロゴ" className="h-10 w-auto" />
          <span className="text-[#4BEA8A] text-xl font-bold tracking-widest">SYSTEM TEAM</span>
        </div>
        <SignOutButton>
          <button className="flex items-center gap-2 bg-[#4BEA8A] hover:bg-[#3DD879] text-[#1E1E1E] px-5 py-2 rounded-lg text-base font-semibold shadow transition-colors">
            <LogOut className="w-5 h-5" /> ログアウト
          </button>
        </SignOutButton>
      </header>

      {/* タイトル */}
      <div className="flex items-center justify-center gap-3 mt-10 mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#4BEA8A" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-[#FFFFFF] tracking-wide">システム管理</h2>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="flex justify-end mb-8">
          <Link
            href="/system-team/organizations/create"
            className="bg-[#4BEA8A] hover:bg-[#3DD879] text-[#1E1E1E] px-6 py-2 rounded-lg text-base font-semibold shadow transition-colors"
          >
            新規組織を作成
          </Link>
        </div>
        <div className="grid gap-8">
          {organizations.map((org) => (
            <div key={org.id} className="bg-[#232323] border border-[#4BEA8A]/30 shadow-xl rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Link href={`/organization/${org.id}/admin-toppage`} className="text-2xl font-bold text-[#4BEA8A] hover:underline">
                    {org.name}
                  </Link>
                  <p className="text-[#CCCCCC] mt-2 text-base">{org.address || '住所未設定'}</p>
                  <p className="text-[#CCCCCC] text-base">{org.managerName || '管理者名未設定'}</p>
                </div>
                <div className="flex flex-col gap-2 min-w-[160px] items-end">
                  <button
                    onClick={() => {
                      setEditingOrg(org);
                      setIsEditOrgModalOpen(true);
                    }}
                    className="bg-[#4BEA8A] hover:bg-[#3DD879] text-[#1E1E1E] rounded-lg px-5 py-2 text-base font-semibold shadow transition-colors"
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
                    className="bg-[#1E1E1E] border border-[#4BEA8A] text-[#4BEA8A] hover:bg-[#222] hover:border-[#3DD879] rounded-lg px-5 py-2 text-base font-semibold shadow transition-colors"
                  >
                    QRスキャナーを追加
                  </button>
                  <button
                    onClick={() => handleDelete(org.id)}
                    className="bg-[#333333] text-[#FFFFFF] hover:bg-[#444444] rounded-lg px-5 py-2 text-base font-semibold shadow transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
              {/* QRスキャナー一覧 */}
              {qrScanners[org.id] && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-4 text-[#FFFFFF]">QRスキャナー一覧</h3>
                  <div className="grid gap-4">
                    {qrScanners[org.id].map((scanner) => (
                      <div key={scanner.id} className="bg-[#2A2A2A] border border-[#4BEA8A]/20 rounded-lg p-4 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-semibold text-[#4BEA8A] text-lg">{scanner.name}</p>
                          <p className="text-sm text-[#CCCCCC]">{scanner.location}</p>
                          <p className="text-xs text-[#888888]">ID: {scanner.scannerId}</p>
                          <p className="text-xs text-[#888888]">パスワード: {scanner.password}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingQrScanner(scanner);
                              setIsEditQrScannerModalOpen(true);
                            }}
                            className="bg-[#4BEA8A] hover:bg-[#3DD879] text-[#1E1E1E] rounded-lg px-4 py-1 text-sm font-semibold shadow transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => {
                              setEditingQrScanner(scanner);
                              setIsPasswordModalOpen(true);
                            }}
                            className="bg-[#232323] border border-[#4BEA8A] text-[#4BEA8A] hover:bg-[#2A2A2A] rounded-lg px-4 py-1 text-sm font-semibold shadow transition-colors"
                          >
                            パスワード変更
                          </button>
                          <button
                            onClick={() => handleUpdateQrScannerStatus(scanner.id, org.id, scanner.status)}
                            className={`rounded-lg px-4 py-1 text-sm font-semibold shadow transition-colors border ${
                              scanner.status === 'active'
                                ? 'bg-[#4BEA8A]/10 text-[#4BEA8A] border-[#4BEA8A] hover:bg-[#4BEA8A]/20'
                                : 'bg-[#333333] text-[#888888] border-[#444444] hover:bg-[#444444]'
                            }`}
                          >
                            {scanner.status === 'active' ? '有効' : '無効'}
                          </button>
                          <button
                            onClick={() => handleDeleteQrScanner(scanner.id, org.id)}
                            className="bg-[#333333] text-[#FFFFFF] hover:bg-[#444444] rounded-lg px-4 py-1 text-sm font-semibold shadow transition-colors"
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
        <Dialog open={isEditOrgModalOpen} onOpenChange={setIsEditOrgModalOpen}>
          <DialogContent className="w-full max-w-lg bg-[#1E1E1E] border border-[#4BEA8A]/30 shadow-2xl rounded-2xl px-8 py-8">
            <DialogTitle className="text-2xl font-bold mb-6 text-[#4BEA8A] text-center tracking-wide">
              組織の編集
            </DialogTitle>
            <div className="space-y-6">
              <div>
                <Label htmlFor="edit-org-name" className="block text-base font-semibold text-[#4BEA8A] mb-2">組織名 <span className="text-[#FF8888]">*</span></Label>
                <Input
                  id="edit-org-name"
                  type="text"
                  value={editingOrg?.name || ''}
                  onChange={(e) => setEditingOrg(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] rounded-lg px-5 py-3 text-lg focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                  placeholder="組織名を入力"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-org-address" className="block text-base font-semibold text-[#4BEA8A] mb-2">住所</Label>
                <Input
                  id="edit-org-address"
                  type="text"
                  value={editingOrg?.address || ''}
                  onChange={(e) => setEditingOrg(prev => prev ? { ...prev, address: e.target.value } : null)}
                  className="w-full bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] rounded-lg px-5 py-3 text-lg focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                  placeholder="住所を入力（任意）"
                />
              </div>
              <div>
                <Label htmlFor="edit-org-manager" className="block text-base font-semibold text-[#4BEA8A] mb-2">管理者名</Label>
                <Input
                  id="edit-org-manager"
                  type="text"
                  value={editingOrg?.managerName || ''}
                  onChange={(e) => setEditingOrg(prev => prev ? { ...prev, managerName: e.target.value } : null)}
                  className="w-full bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] rounded-lg px-5 py-3 text-lg focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                  placeholder="管理者名を入力（任意）"
                />
              </div>
            </div>
            <div className="mt-10 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOrgModalOpen(false);
                  setEditingOrg(null);
                }}
                className="px-8 py-3 text-lg font-semibold rounded-lg border border-[#4BEA8A]/30 text-[#4BEA8A] bg-[#232323] hover:bg-[#333333] hover:text-[#FFFFFF] transition-colors"
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleEditOrganization}
                disabled={isLoading || !editingOrg?.name}
                className="px-8 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] hover:from-[#3DD879] hover:to-[#4BEA8A] shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '更新中...' : '更新'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* QRスキャナー作成モーダル */}
        <Dialog open={isQrScannerModalOpen} onOpenChange={setIsQrScannerModalOpen}>
          <DialogContent className="w-full max-w-lg bg-[#1E1E1E] border border-[#4BEA8A]/30 shadow-2xl rounded-2xl px-8 py-8">
            <DialogTitle className="text-2xl font-bold mb-6 text-[#4BEA8A] text-center tracking-wide">
              QRスキャナーの追加
            </DialogTitle>
            <div className="space-y-6">
              <div>
                <Label htmlFor="qrscanner-name" className="block text-base font-semibold text-[#4BEA8A] mb-2">名前</Label>
                <Input
                  id="qrscanner-name"
                  type="text"
                  value={newQrScanner.name}
                  onChange={(e) => setNewQrScanner({ ...newQrScanner, name: e.target.value })}
                  className="w-full bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] rounded-lg px-5 py-3 text-lg focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                  placeholder="QRスキャナーの名前"
                  autoFocus
                  required
                />
              </div>
              <div>
                <Label htmlFor="qrscanner-description" className="block text-base font-semibold text-[#4BEA8A] mb-2">説明</Label>
                <Input
                  id="qrscanner-description"
                  type="text"
                  value={newQrScanner.description}
                  onChange={(e) => setNewQrScanner({ ...newQrScanner, description: e.target.value })}
                  className="w-full bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] rounded-lg px-5 py-3 text-lg focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                  placeholder="用途や特徴など（任意）"
                />
              </div>
              <div>
                <Label htmlFor="qrscanner-location" className="block text-base font-semibold text-[#4BEA8A] mb-2">設置場所</Label>
                <Input
                  id="qrscanner-location"
                  type="text"
                  value={newQrScanner.location}
                  onChange={(e) => setNewQrScanner({ ...newQrScanner, location: e.target.value })}
                  className="w-full bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] rounded-lg px-5 py-3 text-lg focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                  placeholder="例：受付、会議室Aなど"
                  required
                />
              </div>
            </div>
            <div className="mt-10 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQrScannerModalOpen(false)}
                className="px-8 py-3 text-lg font-semibold rounded-lg border border-[#4BEA8A]/30 text-[#4BEA8A] bg-[#232323] hover:bg-[#333333] hover:text-[#FFFFFF] transition-colors"
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleCreateQrScanner}
                disabled={isLoading || !newQrScanner.name || !newQrScanner.location}
                className="px-8 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] hover:from-[#3DD879] hover:to-[#4BEA8A] shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '作成中...' : '作成'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* QRスキャナー編集モーダル */}
        <Dialog open={isEditQrScannerModalOpen} onOpenChange={setIsEditQrScannerModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogTitle className="text-lg font-medium mb-4">
              QRスキャナーの編集
            </DialogTitle>
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
          </DialogContent>
        </Dialog>

        {/* パスワード変更モーダル */}
        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
          <DialogContent className="w-full max-w-lg bg-[#1E1E1E] border border-[#4BEA8A]/30 shadow-2xl rounded-2xl px-8 py-8">
            <DialogTitle className="text-2xl font-bold mb-6 text-[#4BEA8A] text-center tracking-wide">
              パスワードの変更
            </DialogTitle>
            <div className="space-y-6">
              <div>
                <Label htmlFor="new-password" className="block text-base font-semibold text-[#4BEA8A] mb-2">新しいパスワード</Label>
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] rounded-lg px-5 py-3 text-lg focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                  placeholder="新しいパスワードを入力"
                  autoFocus
                  required
                />
              </div>
            </div>
            <div className="mt-10 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setNewPassword('');
                }}
                className="px-8 py-3 text-lg font-semibold rounded-lg border border-[#4BEA8A]/30 text-[#4BEA8A] bg-[#232323] hover:bg-[#333333] hover:text-[#FFFFFF] transition-colors"
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleUpdatePassword}
                disabled={isLoading || !newPassword}
                className="px-8 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] hover:from-[#3DD879] hover:to-[#4BEA8A] shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '更新中...' : '更新'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}