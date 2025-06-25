import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { ReactNode } from 'react'
import { checkUserRole, SystemRoleType, OrganizationRoleType } from '@/lib/auth/roles'

interface RoleBasedLinkProps {
  href: string
  children: ReactNode
  requiredRole?: SystemRoleType | OrganizationRoleType
  className?: string
}

export const RoleBasedLink = async ({
  href,
  children,
  requiredRole,
  className,
}: RoleBasedLinkProps) => {
  const { userId } = await auth()
  
  // 未認証の場合は非表示
  if (!userId) {
    return null
  }

  // ロールチェック
  const hasRequiredRole = await checkUserRole(userId, requiredRole)
  if (!hasRequiredRole) {
    return null
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
} 