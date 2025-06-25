"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminOrganizationHeader } from '@/components/organization/AdminOrganizationHeader';

export function AdminOrganizationHeaderWrapper() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [organizationName, setOrganizationName] = useState('');
  const [isSystemTeam, setIsSystemTeam] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clerkId, setClerkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      try {
        const userRes = await fetch('/api/users/me');
        const userData = await userRes.json();
        const systemRole = userData.user?.systemRole;
        setIsSystemTeam(systemRole === 'system_team');
        setClerkId(userData.user?.clerkId || null);

        const orgRes = await fetch(`/api/organizations/${organizationId}`);
        const orgData = await orgRes.json();
        setOrganizationName(orgData.organization?.name || '');

        const membershipRes = await fetch(`/api/organizations/${organizationId}/members/me`);
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          const role = membershipData.role;
          setIsAdmin(role === 'admin' || systemRole === 'system_team');
        } else {
          setIsAdmin(systemRole === 'system_team');
        }
      } catch {
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

  return (
    <AdminOrganizationHeader
      organizationId={organizationId}
      organizationName={organizationName}
      isSystemTeam={isSystemTeam}
      isAdmin={isAdmin}
      clerkId={clerkId}
    />
  );
} 