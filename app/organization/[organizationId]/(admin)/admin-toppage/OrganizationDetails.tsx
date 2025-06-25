'use client';

import { useParams } from 'next/navigation';

type Organization = {
  id: string;
  name: string;
  address: string | null;
  managerName: string | null;
  _count: {
    memberships: number;
    qrScanners: number;
  };
};

interface OrganizationDetailsProps {
  organization: Organization;
}

export default function OrganizationDetails({ organization }: OrganizationDetailsProps) {
  const params = useParams();
  const organizationId = params.organizationId as string;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">組織の詳細</h2>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">組織名</dt>
            <dd className="mt-1 text-lg">{organization.name}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">住所</dt>
            <dd className="mt-1">{organization.address || '未設定'}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">担当者名</dt>
            <dd className="mt-1">{organization.managerName || '未設定'}</dd>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <dt className="text-sm font-medium text-gray-500">メンバー数</dt>
            <dd className="mt-1">{organization._count.memberships}人</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">スキャナー数</dt>
            <dd className="mt-1">{organization._count.qrScanners}台</dd>
          </div>
        </dl>
      </div>
    </div>
  );
} 