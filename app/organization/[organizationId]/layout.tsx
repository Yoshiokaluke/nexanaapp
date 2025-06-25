import { ReactNode } from 'react';
import { OrganizationHeaderWrapper } from '@/components/organization/OrganizationHeaderWrapper';

export default function OrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationHeaderWrapper />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">{children}</div>
      </div>
    </div>
  );
} 