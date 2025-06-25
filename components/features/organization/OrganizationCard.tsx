import { FC } from 'react'
import Link from 'next/link'

type OrganizationRole = 'admin' | 'member'

interface Organization {
  id: string
  name: string
  iconUrl?: string | null
  description?: string | null
}

interface OrganizationCardProps {
  organization: Organization
  role: OrganizationRole
}

export const OrganizationCard: FC<OrganizationCardProps> = ({ organization, role }) => {
  return (
    <Link href={`/organization/${organization.id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {organization.iconUrl ? (
                <img
                  className="h-12 w-12 rounded-lg object-cover"
                  src={organization.iconUrl}
                  alt={organization.name}
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {organization.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {organization.name}
              </h3>
              <div className="mt-1">
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}
                `}>
                  {role === 'admin' ? '管理者' : 'メンバー'}
                </span>
              </div>
            </div>
          </div>
          {organization.description && (
            <p className="mt-4 text-sm text-gray-500 line-clamp-2">
              {organization.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
} 