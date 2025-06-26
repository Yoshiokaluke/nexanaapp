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
  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) {
        setUserRole('');
        return;
      }
      const data = await response.json();
      if (!data.user) {
        setUserRole('');
        return;
      }
      if (data.user.systemRole === 'system_team') {
        setUserRole('system_team');
      } else {
        setUserRole('admin');
      }
    } catch (error) {
      console.error('ユーザー権限取得エラー:', error);
      setUserRole('');
    }
  };

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
  }, [organizationId, fetchScanPurposes, fetchUserRole, fetchDepartments]);

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
    
    if (!confirm('このスキャン目的を削除してもよろしいですか？')) {
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
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">スキャン目的管理</h1>
          {userRole === 'system_team' && (
            <p className="text-sm text-blue-600 mt-1">
              システムチーム権限でアクセス中 - 全ての組織の目的を管理できます
            </p>
          )}
        </div>
          <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
              onClick={handleCreateDefaults}
              disabled={isCreateDefaultsLoading}
                    >
              <Settings className="w-4 h-4 mr-2" />
              {isCreateDefaultsLoading ? '作成中...' : 'デフォルト目的を作成'}
                    </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新しい目的を追加
                    </Button>
                  </div>
                </div>

        <ScanPurposeList
          scanPurposes={scanPurposes}
          onDelete={handleDeletePurpose}
          onEdit={handleEditPurpose}
        />

        {/* 追加ダイアログ */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいスキャン目的を追加</DialogTitle>
              <DialogDescription>
                新しいスキャン目的の情報を入力してください
              </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">目的名 *</Label>
              <Input
                id="name"
                value={newPurpose.name}
                onChange={(e) => setNewPurpose({ ...newPurpose, name: e.target.value })}
                placeholder="例: ランチ"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPurpose();
                    }
                  }}
              />
            </div>
            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={newPurpose.description}
                onChange={(e) => setNewPurpose({ ...newPurpose, description: e.target.value })}
                placeholder="例: お昼ご飯を一緒に食べる"
              />
            </div>
            <div>
              <Label htmlFor="order">表示順序</Label>
              <Input
                id="order"
                type="number"
                value={newPurpose.order}
                onChange={(e) => setNewPurpose({ ...newPurpose, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
              <div>
                <Label htmlFor="department">部署</Label>
                <select value={departmentId ?? ""} onChange={e => setDepartmentId(e.target.value || null)}>
                  <option value="">選択してください</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
                <Button onClick={handleAddPurpose} disabled={isLoading || !newPurpose.name.trim()}>
                  {isLoading ? '追加中...' : '追加'}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        {/* 編集ダイアログ */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スキャン目的を編集</DialogTitle>
              <DialogDescription>
                スキャン目的の情報を編集してください
              </DialogDescription>
          </DialogHeader>
          {editingPurpose && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">目的名 *</Label>
                <Input
                  id="edit-name"
                  value={editingPurpose.name}
                  onChange={(e) => setEditingPurpose({ ...editingPurpose, name: e.target.value })}
                    disabled={editingPurpose.order >= 1 && editingPurpose.order <= 5}
                />
                  {(editingPurpose.order >= 1 && editingPurpose.order <= 5) && (
                    <p className="text-sm text-red-500 mt-1">
                      デフォルト目的は編集できません
                    </p>
                  )}
              </div>
              <div>
                <Label htmlFor="edit-description">説明</Label>
                <Textarea
                  id="edit-description"
                  value={editingPurpose.description || ''}
                  onChange={(e) => setEditingPurpose({ ...editingPurpose, description: e.target.value })}
                    disabled={editingPurpose.order >= 1 && editingPurpose.order <= 5}
                />
              </div>
              <div>
                <Label htmlFor="edit-order">表示順序</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={editingPurpose.order}
                  onChange={(e) => setEditingPurpose({ ...editingPurpose, order: parseInt(e.target.value) || 0 })}
                    disabled={editingPurpose.order >= 1 && editingPurpose.order <= 5}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPurpose.isActive}
                    onChange={(e) => setEditingPurpose({ ...editingPurpose, isActive: e.target.checked })}
                      disabled={editingPurpose.order >= 1 && editingPurpose.order <= 5}
                  />
                  有効にする
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  キャンセル
                </Button>
                  <Button 
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