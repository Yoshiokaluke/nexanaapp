import { redirect } from 'next/navigation';

export default function GlobalProfileEditPage({
  params,
}: {
  params: { organizationId: string; clerkId: string };
}) {
  // 既存のグローバルプロフィールページにリダイレクト
  redirect(`/organization-list/users/${params.clerkId}/profile`);
} 