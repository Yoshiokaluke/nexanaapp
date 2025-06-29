"use client";
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { OrganizationHeader } from '@/components/organization/OrganizationHeader';
import { OrganizationNameDisplay } from '@/components/organization/OrganizationNameDisplay';

export function OrganizationHeaderWrapper() {
  const params = useParams();
  const searchParams = useSearchParams();
  const organizationId = params.organizationId as string;
  const [organizationName, setOrganizationName] = useState('');
  const [isSystemTeam, setIsSystemTeam] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clerkId, setClerkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // オンボーディング中は何も表示しない
  const isOnboarding = searchParams.get('from_invitation') === 'true';
  if (isOnboarding) return null;

  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('OrganizationHeaderWrapper: Fetching user data...');
        const userRes = await fetch('/api/users/me');
        console.log('OrganizationHeaderWrapper: User response status:', userRes.status);
        
        if (!userRes.ok) {
          throw new Error(`User API failed: ${userRes.status}`);
        }
        
        const userData = await userRes.json();
        console.log('OrganizationHeaderWrapper: User data:', userData);
        
        const systemRole = userData.user?.systemRole;
        setIsSystemTeam(systemRole === 'system_team');
        setClerkId(userData.user?.clerkId || userData.clerkId || null);

        console.log('OrganizationHeaderWrapper: Fetching organization data...');
        const orgRes = await fetch(`/api/organizations/${organizationId}`);
        console.log('OrganizationHeaderWrapper: Organization response status:', orgRes.status);
        
        if (!orgRes.ok) {
          throw new Error(`Organization API failed: ${orgRes.status}`);
        }
        
        const orgData = await orgRes.json();
        console.log('OrganizationHeaderWrapper: Organization data:', orgData);
        setOrganizationName(orgData.organization?.name || '');

        console.log('OrganizationHeaderWrapper: Fetching membership data...');
        const membershipRes = await fetch(`/api/organizations/${organizationId}/members/me`);
        console.log('OrganizationHeaderWrapper: Membership response status:', membershipRes.status);
        
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          console.log('OrganizationHeaderWrapper: Membership data:', membershipData);
          const role = membershipData.role;
          setIsAdmin(role === 'admin' || systemRole === 'system_team');
        } else {
          console.log('OrganizationHeaderWrapper: Membership not found, using system role');
          setIsAdmin(systemRole === 'system_team');
        }
      } catch (err) {
        console.error('OrganizationHeaderWrapper: Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setOrganizationName('');
        setIsSystemTeam(false);
        setIsAdmin(false);
        setClerkId(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [organizationId]);

  if (loading) {
    return <div className="min-h-[60px] flex items-center justify-center text-gray-500">読み込み中...</div>;
  }

  if (error) {
    return <div className="min-h-[60px] flex items-center justify-center text-red-500">エラー: {error}</div>;
  }

  console.log('OrganizationHeaderWrapper: Rendering with props:', {
    organizationId,
    organizationName,
    isSystemTeam,
    isAdmin,
    clerkId
  });

  return (
    <>
      <OrganizationHeader
        organizationId={organizationId}
        organizationName={organizationName}
        isSystemTeam={isSystemTeam}
        isAdmin={isAdmin}
        clerkId={clerkId}
      />
      <OrganizationNameDisplay organizationName={organizationName} />
    </>
  );
} 