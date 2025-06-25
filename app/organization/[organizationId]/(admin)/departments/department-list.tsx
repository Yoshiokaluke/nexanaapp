'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  order: number;
  isDefault?: boolean;
}

interface DepartmentListProps {
  departments: Department[];
  onDelete: (departmentId: string) => void;
}

export function DepartmentList({ departments, onDelete }: DepartmentListProps) {
  return (
    <div className="space-y-2">
      {departments.map((department) => (
        <div
          key={department.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="font-medium">{department.name}</span>
            {department.isDefault && (
              <Badge variant="secondary" className="text-xs">
                デフォルト
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(department.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 