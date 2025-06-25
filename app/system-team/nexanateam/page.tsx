import { getAuthenticatedUser, isOrganizationMember, checkOrganizationAdmin } from '@/lib/auth/roles';

declare global {
  interface Window {
    __DISABLE_AUTHSYNC__?: boolean;
  }
}

export default function NexanaTeamPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          NEXANA Team
        </h1>
        <p className="text-gray-600">
          Systemチーム専用ページ
        </p>
      </div>
    </div>
  );
}
