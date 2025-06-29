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
  
  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      setError(null);
      
      console.log('OrganizationHeaderWrapper: isOnboarding =', isOnboarding);
      console.log('OrganizationHeaderWrapper: searchParams =', Object.fromEntries(searchParams.entries()));
      
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

        // オンボーディング中の場合は、組織APIの呼び出しをスキップ
        if (isOnboarding) {
          console.log('OrganizationHeaderWrapper: Skipping organization API calls during onboarding');
          setOrganizationName(''); // 組織名は後で設定される
          setIsAdmin(false); // オンボーディング中は管理者権限なし
        } else {
          console.log('OrganizationHeaderWrapper: Fetching organization data...');
          
          // メンバーシップの確認を先に行う
          let membershipVerified = false;
          let retryCount = 0;
          const maxRetries = 5;
          
          while (!membershipVerified && retryCount < maxRetries) {
            try {
              const membershipRes = await fetch(`/api/organizations/${organizationId}/members/me`);
              if (membershipRes.ok) {
                console.log('OrganizationHeaderWrapper: Membership verified');
                membershipVerified = true;
              } else {
                console.log(`OrganizationHeaderWrapper: Membership check failed (${retryCount + 1}/${maxRetries})`);
                retryCount++;
                if (retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            } catch (error) {
              console.log(`OrganizationHeaderWrapper: Membership check error (${retryCount + 1}/${maxRetries})`);
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          // 最終的なメンバーシップ確認
          console.log('OrganizationHeaderWrapper: Final membership check before organization API call');
          const finalMembershipRes = await fetch(`/api/organizations/${organizationId}/members/me`);
          console.log('OrganizationHeaderWrapper: Final membership response status:', finalMembershipRes.status);
          
          if (finalMembershipRes.ok) {
            const finalMembershipData = await finalMembershipRes.json();
            console.log('OrganizationHeaderWrapper: Final membership data:', finalMembershipData);
          } else {
            console.warn('OrganizationHeaderWrapper: Final membership check failed, but proceeding with organization API call');
          }
          
          const orgRes = await fetch(`/api/organizations/${organizationId}`);
          console.log('OrganizationHeaderWrapper: Organization response status:', orgRes.status);
          
          if (!orgRes.ok) {
            const errorText = await orgRes.text();
            console.error('OrganizationHeaderWrapper: Organization API error details:', errorText);
            
            // 403エラーの場合は、メンバーシップがまだ確立されていない可能性があるため、
            // エラーを表示せずに空の状態で続行
            if (orgRes.status === 403) {
              console.log('OrganizationHeaderWrapper: 403 error detected, skipping organization data fetch');
              setOrganizationName('');
              setIsAdmin(false);
              return;
            }
            
            throw new Error(`Organization API failed: ${orgRes.status} - ${errorText}`);
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
        }
      } catch (err) {
        console.error('OrganizationHeaderWrapper: Error:', err);
        
        // 403エラーの場合は、エラーを表示せずに空の状態で続行
        if (err instanceof Error && err.message.includes('403')) {
          console.log('OrganizationHeaderWrapper: 403 error detected, continuing with empty state');
          setOrganizationName('');
          setIsSystemTeam(false);
          setIsAdmin(false);
          setClerkId(null);
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setOrganizationName('');
          setIsSystemTeam(false);
          setIsAdmin(false);
          setClerkId(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [organizationId, isOnboarding, searchParams]);

  // オンボーディング中は何も表示しない
  if (isOnboarding) return null;

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