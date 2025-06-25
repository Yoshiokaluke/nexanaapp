'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DepartmentList } from './department-list';
import { Plus } from 'lucide-react';
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
  const [newDepartmentName, setNewDepartmentName] = useState('');

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

  return (
    <>
      <AdminMenu />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">部署管理</h1>
        </div>
        <div className="flex items-center space-x-2 mb-6">
          <Input
            id="name"
            value={newDepartmentName}
            onChange={e => setNewDepartmentName(e.target.value)}
            placeholder="部署名を入力"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddDepartment();
              }
            }}
            className="w-64"
          />
          <Button
            onClick={handleAddDepartment}
            disabled={isLoading || !newDepartmentName.trim()}
          >
            {isLoading ? '追加中...' : '追加'}
          </Button>
        </div>
        <DepartmentList
          departments={departments}
          onDelete={handleDeleteDepartment}
        />
      </div>
    </>
  );
} 