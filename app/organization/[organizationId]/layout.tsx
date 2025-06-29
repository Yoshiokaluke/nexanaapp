"use client";

import { ReactNode } from 'react';
import { OrganizationHeaderWrapper } from '@/components/organization/OrganizationHeaderWrapper';
import { useSearchParams } from 'next/navigation';

export default function OrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('from_invitation') === 'true';

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {!isOnboarding && <OrganizationHeaderWrapper />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">{children}</div>
      </div>
    </div>
  );
} 