'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ScanPurposeList } from './scan-purpose-list';
import { Plus, Settings } from 'lucide-react';
import { AdminMenu } from '@/components/organization/AdminMenu';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ScanPurpose {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ScanPurposesPage() {
  const { organizationId } = useParams();
  const [scanPurposes, setScanPurposes] = useState<ScanPurpose[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDefaultsLoading, setIsCreateDefaultsLoading] = useState(false);
  const [editingPurpose, setEditingPurpose] = useState<ScanPurpose | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [newPurpose, setNewPurpose] = useState({
    name: '',
    description: '',
    order: 0
  });
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // スキャン目的一覧の取得
  const fetchScanPurposes = useCallback(async () => {
    try {
      console.log('スキャン目的一覧を取得中...', organizationId);
      const response = await fetch(`/api/organizations/${organizationId}/scan-purposes`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('スキャン目的一覧取得エラー:', errorData);
        throw new Error(errorData.error || 'スキャン目的一覧の取得に失敗しました');
      }
      
      const data = await response.json();
      console.log('取得したスキャン目的:', data);
      setScanPurposes(data);
    } catch (error) {
      console.error('スキャン目的一覧取得エラー:', error);
      toast.error(error instanceof Error ? error.message : 'スキャン目的一覧の取得に失敗しました');
    }
  }, [organizationId]);

  // ユーザー権限の取得
  const fetchUserRole = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) {
        // APIエンドポイントが存在しない場合や認証エラーの場合は、デフォルトでadmin権限を設定
        console.log('ユーザー権限取得に失敗しました。デフォルトでadmin権限を設定します。');
        setUserRole('admin');
        return;
      }
      const data = await response.json();
      if (!data.user) {
        setUserRole('admin');
        return;
      }
      if (data.user.systemRole === 'system_team') {
        setUserRole('system_team');
      } else {
        setUserRole('admin');
      }
    } catch (error) {
      console.error('ユーザー権限取得エラー:', error);
      // エラーが発生した場合もデフォルトでadmin権限を設定
      setUserRole('admin');
    }
  }, []);

  // 部署一覧を取得する関数
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/departments`);
      if (!response.ok) return;
        const data = await response.json();
      setDepartments(data);
    } catch (e) {
      // エラー処理
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchScanPurposes();
      fetchUserRole();
      fetchDepartments();
    }
  }, [organizationId]);

  // デフォルト目的の作成
  const handleCreateDefaults = async () => {
    setIsCreateDefaultsLoading(true);
    try {
      console.log('デフォルト目的を作成中...', organizationId);
      
      const response = await fetch(`/api/organizations/${organizationId}/scan-purposes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-defaults' }),
      });

      console.log('レスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('デフォルト目的作成エラー:', errorData);
        throw new Error(errorData.error || 'デフォルト目的の作成に失敗しました');
      }

      const result = await response.json();
      console.log('作成結果:', result);
      
      await fetchScanPurposes();
      toast.success(result.message || 'デフォルト目的を作成しました');
    } catch (error) {
      console.error('デフォルト目的作成エラー:', error);
      toast.error(error instanceof Error ? error.message : 'デフォルト目的の作成に失敗しました');
    } finally {
      setIsCreateDefaultsLoading(false);
    }
  };

  // スキャン目的の追加
  const handleAddPurpose = async () => {
    if (!newPurpose.name.trim()) {
      toast.error('目的名を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      console.log('スキャン目的を追加中...', { organizationId, ...newPurpose });
      
      const response = await fetch(`/api/organizations/${organizationId}/scan-purposes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPurpose),
      });

      console.log('レスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('スキャン目的追加エラー:', errorData);
        throw new Error(errorData.error || 'スキャン目的の追加に失敗しました');
      }

      const newPurposeData = await response.json();
      console.log('追加されたスキャン目的:', newPurposeData);
      
      setScanPurposes(prev => [...prev, newPurposeData]);
      setIsAddDialogOpen(false);
        setNewPurpose({ name: '', description: '', order: 0 });
      toast.success('スキャン目的を追加しました');
    } catch (error) {
      console.error('スキャン目的追加エラー:', error);
      toast.error(error instanceof Error ? error.message : 'スキャン目的の追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // スキャン目的の更新
  const handleUpdatePurpose = async () => {
    if (!editingPurpose || !editingPurpose.name.trim()) {
      toast.error('目的名を入力してください');
      return;
    }

    // デフォルト目的（order 1-5）は編集不可
    if (editingPurpose.order >= 1 && editingPurpose.order <= 5) {
      toast.error('デフォルト目的は編集できません');
      return;
    }

    setIsLoading(true);
    try {
      console.log('スキャン目的を更新中...', { organizationId, ...editingPurpose });
      
      const response = await fetch(
        `/api/organizations/${organizationId}/scan-purposes/${editingPurpose.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingPurpose)
        }
      );

      console.log('レスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('スキャン目的更新エラー:', errorData);
        throw new Error(errorData.error || 'スキャン目的の更新に失敗しました');
      }

      const updatedPurpose = await response.json();
      console.log('更新されたスキャン目的:', updatedPurpose);
      
      setScanPurposes(prev => prev.map(p => p.id === editingPurpose.id ? updatedPurpose : p));
      setIsEditDialogOpen(false);
      setEditingPurpose(null);
      toast.success('スキャン目的を更新しました');
    } catch (error) {
      console.error('スキャン目的更新エラー:', error);
      toast.error(error instanceof Error ? error.message : 'スキャン目的の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // スキャン目的の削除
  const handleDeletePurpose = async (purposeId: string) => {
    const purpose = scanPurposes.find(p => p.id === purposeId);
    
    console.log('削除対象のスキャン目的:', purpose);
    
    const isDefault = (purpose?.order ?? 0) >= 1 && (purpose?.order ?? 0) <= 5;
    const confirmMessage = isDefault 
      ? 'このデフォルト目的を削除してもよろしいですか？'
      : 'このスキャン目的を削除してもよろしいですか？';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('スキャン目的削除リクエスト送信中...', { organizationId, purposeId });
      
      const response = await fetch(`/api/organizations/${organizationId}/scan-purposes/${purposeId}`, {
        method: 'DELETE',
      });

      console.log('削除レスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('削除エラー:', errorData);
        throw new Error(errorData.error || 'スキャン目的の削除に失敗しました');
      }

      const result = await response.json();
      console.log('削除結果:', result);

      setScanPurposes(prev => prev.filter(p => p.id !== purposeId));
      toast.success('スキャン目的を削除しました');
    } catch (error) {
      console.error('スキャン目的削除エラー:', error);
      toast.error(error instanceof Error ? error.message : 'スキャン目的の削除に失敗しました');
    }
  };

  // 編集ダイアログを開く
  const handleEditPurpose = (purpose: ScanPurpose) => {
    setEditingPurpose(purpose);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <AdminMenu />
      <div className="container mx-auto py-8 bg-[#1E1E1E] min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#4BEA8A]">スキャン目的管理</h1>
          <Button
            className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> 新規目的追加
          </Button>
        </div>
        <Card className="bg-[#232323] border border-[#4BEA8A]/20 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#4BEA8A]">
              <Settings className="w-5 h-5" /> スキャン目的一覧
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScanPurposeList
              scanPurposes={scanPurposes}
              onDelete={handleDeletePurpose}
              onEdit={handleEditPurpose}
            />
          </CardContent>
        </Card>

        {/* 追加ダイアログ */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF]">
            <DialogHeader>
              <DialogTitle className="text-[#4BEA8A]">新しいスキャン目的を追加</DialogTitle>
              <DialogDescription className="text-[#CCCCCC]">
                新しいスキャン目的の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dialog-name" className="text-[#FFFFFF]">目的名 *</Label>
                <Input
                  id="dialog-name"
                  value={newPurpose.name}
                  onChange={e => setNewPurpose({ ...newPurpose, name: e.target.value })}
                  placeholder="目的名を入力"
                  className="bg-[#2A2A2A] border-[#4BEA8A]/20 text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPurpose();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="dialog-desc" className="text-[#FFFFFF]">説明</Label>
                <Textarea
                  id="dialog-desc"
                  value={newPurpose.description}
                  onChange={e => setNewPurpose({ ...newPurpose, description: e.target.value })}
                  placeholder="説明（任意）"
                  className="bg-[#2A2A2A] border-[#4BEA8A]/20 text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-[#4BEA8A] text-[#4BEA8A] hover:bg-[#333333]" onClick={() => setIsAddDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold" onClick={handleAddPurpose} disabled={isLoading || !newPurpose.name.trim()}>
                  {isLoading ? '追加中...' : '追加'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 編集ダイアログ */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF]">
            <DialogHeader>
              <DialogTitle className="text-[#4BEA8A]">スキャン目的を編集</DialogTitle>
              <DialogDescription className="text-[#CCCCCC]">
                スキャン目的の情報を編集してください
              </DialogDescription>
            </DialogHeader>
            {editingPurpose && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-[#FFFFFF]">目的名 *</Label>
                  <Input
                    id="edit-name"
                    value={editingPurpose.name}
                    onChange={e => setEditingPurpose({ ...editingPurpose, name: e.target.value })}
                    placeholder="目的名を入力"
                    className="bg-[#2A2A2A] border-[#4BEA8A]/20 text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                    disabled={editingPurpose.order >= 1 && editingPurpose.order <= 5}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !(editingPurpose.order >= 1 && editingPurpose.order <= 5)) {
                        e.preventDefault();
                        handleUpdatePurpose();
                      }
                    }}
                  />
                  {(editingPurpose.order >= 1 && editingPurpose.order <= 5) && (
                    <p className="text-sm text-red-400 mt-1">
                      デフォルト目的は編集できません
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-desc" className="text-[#FFFFFF]">説明</Label>
                  <Textarea
                    id="edit-desc"
                    value={editingPurpose.description || ''}
                    onChange={e => setEditingPurpose({ ...editingPurpose, description: e.target.value })}
                    placeholder="説明（任意）"
                    className="bg-[#2A2A2A] border-[#4BEA8A]/20 text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                    rows={3}
                    disabled={editingPurpose.order >= 1 && editingPurpose.order <= 5}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="border-[#4BEA8A] text-[#4BEA8A] hover:bg-[#333333]" onClick={() => setIsEditDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button 
                    className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold"
                    onClick={handleUpdatePurpose} 
                    disabled={isLoading || !editingPurpose.name.trim() || (editingPurpose.order >= 1 && editingPurpose.order <= 5)}
                  >
                    {isLoading ? '更新中...' : '更新'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
} 