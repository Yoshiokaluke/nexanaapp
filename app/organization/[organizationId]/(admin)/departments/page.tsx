'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { DepartmentList } from './department-list';
import { Plus, Building2 } from 'lucide-react';
import { AdminMenu } from '@/components/organization/AdminMenu';

interface Department {
  id: string;
  name: string;
  order: number;
  isDefault?: boolean;
}

export default function DepartmentsPage() {
  const { organizationId } = useParams();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  // Dialogの状態変更を監視
  useEffect(() => {
    console.log('isAddDialogOpen changed to:', isAddDialogOpen);
  }, [isAddDialogOpen]);

  // 部署一覧の取得
  const fetchDepartments = useCallback(async () => {
    try {
      console.log('部署一覧を取得中...', organizationId);
      const response = await fetch(`/api/organizations/${organizationId}/departments`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('部署一覧取得エラー:', errorData);
        throw new Error(errorData.error || '部署一覧の取得に失敗しました');
      }
      
      const data = await response.json();
      console.log('取得した部署:', data);
      setDepartments(data);
    } catch (error) {
      console.error('部署一覧取得エラー:', error);
      toast.error(error instanceof Error ? error.message : '部署一覧の取得に失敗しました');
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchDepartments();
    }
  }, [organizationId, fetchDepartments]);

  // 部署の追加
  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast.error('部署名を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      console.log('部署を追加中...', { organizationId, name: newDepartmentName });
      
      const response = await fetch(`/api/organizations/${organizationId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDepartmentName.trim() }),
      });

      console.log('レスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('部署追加エラー:', errorData);
        throw new Error(errorData.error || '部署の追加に失敗しました');
      }

      const newDepartment = await response.json();
      console.log('追加された部署:', newDepartment);
      
      setDepartments(prev => [...prev, newDepartment]);
      setIsAddDialogOpen(false);
      setNewDepartmentName('');
      toast.success('部署を追加しました');
    } catch (error) {
      console.error('部署追加エラー:', error);
      toast.error(error instanceof Error ? error.message : '部署の追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 部署の削除
  const handleDeleteDepartment = async (departmentId: string) => {
    const department = departments.find(dept => dept.id === departmentId);
    const isDefault = department?.isDefault;
    
    console.log('削除対象の部署:', department);
    
    const confirmMessage = isDefault 
      ? 'この部署はデフォルト部署です。削除してもよろしいですか？'
      : 'この部署を削除してもよろしいですか？';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('部署削除リクエスト送信中...', { organizationId, departmentId });
      
      const response = await fetch(`/api/organizations/${organizationId}/departments/${departmentId}`, {
        method: 'DELETE',
      });

      console.log('削除レスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('削除エラー:', errorData);
        throw new Error(errorData.error || '部署の削除に失敗しました');
      }

      const result = await response.json();
      console.log('削除結果:', result);

      setDepartments(prev => prev.filter(dept => dept.id !== departmentId));
      toast.success('部署を削除しました');
    } catch (error) {
      console.error('部署削除エラー:', error);
      toast.error(error instanceof Error ? error.message : '部署の削除に失敗しました');
    }
  };

  // 部署の編集
  const handleEditDepartment = async () => {
    if (!editingDepartment || !editingDepartment.name.trim()) {
      toast.error('部署名を入力してください');
      return;
    }

    if (editingDepartment.isDefault) {
      toast.error('デフォルト部署は編集できません');
      return;
    }

    setIsLoading(true);
    try {
      console.log('部署を編集中...', { organizationId, departmentId: editingDepartment.id, name: editingDepartment.name });
      
      const response = await fetch(`/api/organizations/${organizationId}/departments/${editingDepartment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingDepartment.name.trim() }),
      });

      console.log('レスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('部署編集エラー:', errorData);
        throw new Error(errorData.error || '部署の編集に失敗しました');
      }

      const updatedDepartment = await response.json();
      console.log('編集された部署:', updatedDepartment);
      
      setDepartments(prev => prev.map(dept => dept.id === editingDepartment.id ? updatedDepartment : dept));
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
      toast.success('部署を編集しました');
    } catch (error) {
      console.error('部署編集エラー:', error);
      toast.error(error instanceof Error ? error.message : '部署の編集に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 編集ダイアログを開く
  const handleEditDepartmentClick = (department: Department) => {
    setEditingDepartment(department);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <AdminMenu />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">部署管理</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新しい部署を追加
          </Button>
        </div>

        {/* 部署追加フォームカード */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              新しい部署を追加
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-4">
              <div className="flex-1 max-w-md">
                <Label htmlFor="department-name" className="text-sm font-medium text-gray-700 mb-2 block">
                  部署名
                </Label>
          <Input
                  id="department-name"
            value={newDepartmentName}
            onChange={e => setNewDepartmentName(e.target.value)}
                  placeholder="例: 営業部、開発部、人事部"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddDepartment();
              }
            }}
                  className="w-full"
          />
              </div>
          <Button
            onClick={handleAddDepartment}
            disabled={isLoading || !newDepartmentName.trim()}
                className="px-6"
          >
            {isLoading ? '追加中...' : '追加'}
          </Button>
        </div>
            <p className="text-sm text-gray-500 mt-2">
              部署名を入力してEnterキーを押すか、追加ボタンをクリックしてください
            </p>
          </CardContent>
        </Card>

        {/* 部署一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>部署一覧</CardTitle>
          </CardHeader>
          <CardContent>
        <DepartmentList
          departments={departments}
          onDelete={handleDeleteDepartment}
              onEdit={handleEditDepartmentClick}
        />
          </CardContent>
        </Card>

        {/* 追加ダイアログ */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しい部署を追加</DialogTitle>
              <DialogDescription>
                新しい部署の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dialog-name">部署名 *</Label>
                <Input
                  id="dialog-name"
                  value={newDepartmentName}
                  onChange={e => setNewDepartmentName(e.target.value)}
                  placeholder="例: 営業部"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDepartment();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddDepartment} disabled={isLoading || !newDepartmentName.trim()}>
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
              <DialogTitle>部署を編集</DialogTitle>
              <DialogDescription>
                部署名を編集してください
              </DialogDescription>
            </DialogHeader>
            {editingDepartment && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">部署名 *</Label>
                  <Input
                    id="edit-name"
                    value={editingDepartment.name}
                    onChange={e => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                    placeholder="例: 営業部"
                    disabled={editingDepartment.isDefault}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !editingDepartment.isDefault) {
                        e.preventDefault();
                        handleEditDepartment();
                      }
                    }}
                  />
                  {editingDepartment.isDefault && (
                    <p className="text-sm text-red-500 mt-1">
                      デフォルト部署は編集できません
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button 
                    onClick={handleEditDepartment} 
                    disabled={isLoading || !editingDepartment.name.trim() || editingDepartment.isDefault}
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