'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit } from 'lucide-react';

interface ScanPurpose {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScanPurposeListProps {
  scanPurposes: ScanPurpose[];
  onDelete: (purposeId: string) => void;
  onEdit: (purpose: ScanPurpose) => void;
}

export function ScanPurposeList({ scanPurposes, onDelete, onEdit }: ScanPurposeListProps) {
  return (
    <div className="space-y-2">
      {scanPurposes.map((purpose) => {
        const isDefault = purpose.order >= 1 && purpose.order <= 5;
        
        return (
          <div
            key={purpose.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="font-medium">{purpose.name}</span>
                <Badge variant={purpose.isActive ? 'default' : 'secondary'} className="text-xs">
                  {purpose.isActive ? '有効' : '無効'}
                </Badge>
                {isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    デフォルト
                  </Badge>
                )}
                <span className="text-sm text-gray-500">順序: {purpose.order}</span>
              </div>
              {purpose.description && (
                <p className="text-gray-600 mt-1 text-sm">{purpose.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(purpose)}
                  className="text-blue-600 hover:text-blue-800"
                  title="編集"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(purpose.id)}
                className="text-red-600 hover:text-red-800"
                title={isDefault ? "デフォルト目的を削除" : "削除"}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
} 