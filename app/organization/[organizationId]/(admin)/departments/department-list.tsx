'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  order: number;
  isDefault?: boolean;
}

interface DepartmentListProps {
  departments: Department[];
  onDelete: (departmentId: string) => void;
  onEdit: (department: Department) => void;
}

export function DepartmentList({ departments, onDelete, onEdit }: DepartmentListProps) {
  return (
    <div className="space-y-2">
      {departments.map((department) => (
        <div
          key={department.id}
          className="flex items-center justify-between p-4 border border-[#4BEA8A]/20 rounded-lg bg-[#2A2A2A] hover:bg-[#232323] transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="font-medium text-[#FFFFFF]">{department.name}</span>
            {department.isDefault && (
              <Badge className="text-xs bg-[#4BEA8A]/20 text-[#4BEA8A] border border-[#4BEA8A]">デフォルト</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!department.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(department)}
                className="text-[#4BEA8A] hover:bg-[#333333] hover:text-[#FFFFFF]"
                title="編集"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(department.id)}
              className="text-[#FFFFFF] hover:text-[#4BEA8A] hover:bg-[#333333]"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
      {departments.length === 0 && (
        <div className="text-center py-8 text-[#CCCCCC]">
          部署がありません。新しい部署を追加してください。
        </div>
      )}
    </div>
  );
} 