'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { checkSystemTeamRole } from '@/lib/auth/roles';

interface SystemTeamProtectedProps {
  children: React.ReactNode;
}

export default function SystemTeamProtected({ children }: SystemTeamProtectedProps) {
  const { userId } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!userId) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      const isSystemTeam = await checkSystemTeamRole(userId);
      setIsAuthorized(isSystemTeam);
      setIsLoading(false);
    };

    checkAccess();
  }, [userId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <div>アクセス権限がありません</div>;
  }

  return <>{children}</>;
} 