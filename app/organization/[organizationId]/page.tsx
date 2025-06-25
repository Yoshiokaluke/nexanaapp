"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OrganizationHeader } from '@/components/organization/OrganizationHeader';

export default function OrganizationTopPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [organizationName, setOrganizationName] = useState('');
  const [isSystemTeam, setIsSystemTeam] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      try {
        const userRes = await fetch('/api/users/me');
        const userData = await userRes.json();
        const systemRole = userData.user?.systemRole;
        setIsSystemTeam(systemRole === 'system_team');

        const orgRes = await fetch(`/api/organizations/${organizationId}`);
        const orgData = await orgRes.json();
        setOrganizationName(orgData.organization?.name || '');

        const membershipRes = await fetch(`/api/organizations/${organizationId}/members/me`);
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          const role = membershipData.role;
          setIsAdmin(role === 'admin' || systemRole === 'system_team');
          setIsMember(role === 'member' || role === 'admin' || systemRole === 'system_team');
        } else {
          setIsAdmin(systemRole === 'system_team');
          setIsMember(systemRole === 'system_team');
        }
      } catch {
        setOrganizationName('');
        setIsSystemTeam(false);
        setIsAdmin(false);
        setIsMember(false);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ヒーローセクション */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            {/* 組織名 */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
                  {organizationName}
                </h1>
              </div>
              
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                組織の管理とメンバーシップを効率的に行いましょう
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 機能セクション */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">メンバー管理</h3>
              <p className="text-gray-600">組織のメンバーを簡単に管理し、権限を設定できます</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">QRコード認証</h3>
              <p className="text-gray-600">セキュアなQRコードでメンバー認証を簡単に行えます</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">リアルタイム同期</h3>
              <p className="text-gray-600">メンバーの変更や更新がリアルタイムで同期されます</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
