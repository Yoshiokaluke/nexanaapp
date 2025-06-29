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
      console.log('レスポンスヘッダー:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('エラーレスポンスのJSONパースに失敗:', parseError);
          const errorText = await response.text();
          console.error('エラーレスポンスのテキスト:', errorText);
          throw new Error('サーバーエラーが発生しました');
        }
        
        console.error('部署追加エラー:', errorData);
        
        // より詳細なエラーメッセージを表示
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || '部署の追加に失敗しました';
        
        throw new Error(errorMessage);
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
      <div className="container mx-auto py-8 bg-[#1E1E1E] min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#4BEA8A]">部署管理</h1>
          <Button
            className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> 新規部署追加
          </Button>
        </div>
        <Card className="bg-[#232323] border border-[#4BEA8A]/20 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#4BEA8A]">
              <Building2 className="w-5 h-5" /> 部署一覧
            </CardTitle>
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
          <DialogContent className="bg-[#232323] border border-[#4BEA8A]/30 text-[#FFFFFF]">
            <DialogHeader>
              <DialogTitle className="text-[#4BEA8A]">新しい部署を追加</DialogTitle>
              <DialogDescription className="text-[#CCCCCC]">
                新しい部署の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dialog-name" className="text-[#FFFFFF]">部署名 *</Label>
                <Input
                  id="dialog-name"
                  value={newDepartmentName}
                  onChange={e => setNewDepartmentName(e.target.value)}
                  placeholder="部署名を入力"
                  className="bg-[#2A2A2A] border-[#4BEA8A]/20 text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDepartment();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-[#4BEA8A] text-[#4BEA8A] hover:bg-[#333333]" onClick={() => setIsAddDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold" onClick={handleAddDepartment} disabled={isLoading || !newDepartmentName.trim()}>
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
              <DialogTitle className="text-[#4BEA8A]">部署を編集</DialogTitle>
              <DialogDescription className="text-[#CCCCCC]">
                部署名を編集してください
              </DialogDescription>
            </DialogHeader>
            {editingDepartment && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-[#FFFFFF]">部署名 *</Label>
                  <Input
                    id="edit-name"
                    value={editingDepartment.name}
                    onChange={e => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                    placeholder="部署名を入力"
                    className="bg-[#2A2A2A] border-[#4BEA8A]/20 text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                    disabled={editingDepartment.isDefault}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !editingDepartment.isDefault) {
                        e.preventDefault();
                        handleEditDepartment();
                      }
                    }}
                  />
                  {editingDepartment.isDefault && (
                    <p className="text-sm text-red-400 mt-1">
                      デフォルト部署は編集できません
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="border-[#4BEA8A] text-[#4BEA8A] hover:bg-[#333333]" onClick={() => setIsEditDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button 
                    className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold"
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