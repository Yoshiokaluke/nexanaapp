import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OrganizationListHeader } from '@/components/features/organization/OrganizationListHeader'

export const dynamic = 'force-dynamic';

export default async function OrganizationListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <OrganizationListHeader />
      {children}
    </div>
  )
} 