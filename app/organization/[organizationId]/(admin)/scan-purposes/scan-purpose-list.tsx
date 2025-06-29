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
            className="flex items-center justify-between p-4 border border-[#4BEA8A]/20 rounded-lg bg-[#2A2A2A] hover:bg-[#232323] transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="font-medium text-[#FFFFFF]">{purpose.name}</span>
                <Badge className={`text-xs ${purpose.isActive ? 'bg-[#4BEA8A]/20 text-[#4BEA8A] border border-[#4BEA8A]' : 'bg-[#333333] text-[#888888] border border-[#444444]'}`}>{purpose.isActive ? '有効' : '無効'}</Badge>
                {isDefault && (
                  <Badge className="text-xs bg-[#4BEA8A]/20 text-[#4BEA8A] border border-[#4BEA8A]">デフォルト</Badge>
                )}
                <span className="text-sm text-[#CCCCCC]">順序: {purpose.order}</span>
              </div>
              {purpose.description && (
                <p className="text-[#CCCCCC] mt-1 text-sm">{purpose.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(purpose)}
                  className="text-[#4BEA8A] hover:bg-[#333333] hover:text-[#FFFFFF]"
                  title="編集"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(purpose.id)}
                className={`hover:bg-[#333333] ${isDefault ? 'text-[#888888] cursor-not-allowed' : 'text-[#FFFFFF] hover:text-[#4BEA8A]'}`}
                title={isDefault ? "デフォルト目的を削除" : "削除"}
                disabled={isDefault}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
      {scanPurposes.length === 0 && (
        <div className="text-center py-8 text-[#CCCCCC]">
          スキャン目的がありません。新しい目的を追加してください。
        </div>
      )}
    </div>
  );
} 