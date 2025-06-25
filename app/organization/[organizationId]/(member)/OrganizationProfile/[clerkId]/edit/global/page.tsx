import { redirect } from 'next/navigation';

export default async function GlobalProfileEditPage({
  params,
}: {
  params: Promise<{ organizationId: string; clerkId: string }>;
}) {
  const { clerkId } = await params;
  // 既存のグローバルプロフィールページにリダイレクト
  redirect(`/organization-list/users/${clerkId}/profile`);
} 