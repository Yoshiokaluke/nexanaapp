'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ScanPurpose {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScanPurposesPageProps {
  params: {
    organizationId: string;
  };
}

export default function ScanPurposesPage({ params }: ScanPurposesPageProps) {
  const router = useRouter();
  const [scanPurposes, setScanPurposes] = useState<ScanPurpose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPurpose, setEditingPurpose] = useState<ScanPurpose | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [newPurpose, setNewPurpose] = useState({
    name: '',
    description: '',
    order: 0
  });

  useEffect(() => {
    fetchScanPurposes();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user.systemRole === 'system_team') {
          setUserRole('system_team');
        } else {
          setUserRole('admin');
        }
      }
    } catch (error) {
      console.error('ユーザー権限取得エラー:', error);
    }
  };

  const fetchScanPurposes = async () => {
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/scan-purposes`);
      if (response.ok) {
        const data = await response.json();
        setScanPurposes(data);
      } else {
        console.error('スキャン目的の取得に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePurpose = async () => {
    if (!newPurpose.name.trim()) return;

    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/scan-purposes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPurpose)
      });

      if (response.ok) {
        await fetchScanPurposes();
        setIsCreateModalOpen(false);
        setNewPurpose({ name: '', description: '', order: 0 });
      } else {
        const error = await response.json();
        alert(error.error || '作成に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
      alert('作成に失敗しました');
    }
  };

  const handleUpdatePurpose = async () => {
    if (!editingPurpose || !editingPurpose.name.trim()) return;

    try {
      const response = await fetch(
        `/api/organizations/${params.organizationId}/scan-purposes/${editingPurpose.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingPurpose)
        }
      );

      if (response.ok) {
        await fetchScanPurposes();
        setIsEditModalOpen(false);
        setEditingPurpose(null);
      } else {
        const error = await response.json();
        alert(error.error || '更新に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
      alert('更新に失敗しました');
    }
  };

  const handleDeletePurpose = async (purposeId: string) => {
    if (!confirm('このスキャン目的を削除してもよろしいですか？')) return;

    try {
      const response = await fetch(
        `/api/organizations/${params.organizationId}/scan-purposes/${purposeId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await fetchScanPurposes();
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const handleEditPurpose = (purpose: ScanPurpose) => {
    setEditingPurpose(purpose);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">スキャン目的管理</h1>
          {userRole === 'system_team' && (
            <p className="text-sm text-blue-600 mt-1">
              システムチーム権限でアクセス中 - 全ての組織の目的を管理できます
            </p>
          )}
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          新しい目的を追加
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>スキャン目的一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {scanPurposes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              スキャン目的が登録されていません
            </p>
          ) : (
            <div className="space-y-4">
              {scanPurposes.map((purpose) => (
                <div
                  key={purpose.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{purpose.name}</h3>
                      <Badge variant={purpose.isActive ? 'default' : 'secondary'}>
                        {purpose.isActive ? '有効' : '無効'}
                      </Badge>
                      <span className="text-sm text-gray-500">順序: {purpose.order}</span>
                    </div>
                    {purpose.description && (
                      <p className="text-gray-600 mt-1">{purpose.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPurpose(purpose)}
                    >
                      編集
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePurpose(purpose.id)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 作成モーダル */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいスキャン目的を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">目的名 *</Label>
              <Input
                id="name"
                value={newPurpose.name}
                onChange={(e) => setNewPurpose({ ...newPurpose, name: e.target.value })}
                placeholder="例: ランチ"
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreatePurpose}>作成</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 編集モーダル */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スキャン目的を編集</DialogTitle>
          </DialogHeader>
          {editingPurpose && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">目的名 *</Label>
                <Input
                  id="edit-name"
                  value={editingPurpose.name}
                  onChange={(e) => setEditingPurpose({ ...editingPurpose, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">説明</Label>
                <Textarea
                  id="edit-description"
                  value={editingPurpose.description || ''}
                  onChange={(e) => setEditingPurpose({ ...editingPurpose, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-order">表示順序</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={editingPurpose.order}
                  onChange={(e) => setEditingPurpose({ ...editingPurpose, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPurpose.isActive}
                    onChange={(e) => setEditingPurpose({ ...editingPurpose, isActive: e.target.checked })}
                  />
                  有効にする
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleUpdatePurpose}>更新</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 