import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCurrentUser() {
  try {
    console.log('=== 現在のユーザー権限確認 ===')
    
    // 組織ID
    const organizationId = 'cmch1t5k10006tag48b7wck9k'
    console.log(`確認対象組織ID: ${organizationId}`)

    // 全ユーザーを表示
    console.log('\n=== 全ユーザー一覧 ===')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        systemRole: true
      }
    })

    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.clerkId}) - systemRole: ${user.systemRole}`)
    })

    // この組織のメンバーシップを確認
    console.log('\n=== 組織メンバーシップ一覧 ===')
    const memberships = await prisma.organizationMembership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            systemRole: true
          }
        }
      }
    })

    memberships.forEach(membership => {
      console.log(`- ${membership.user.email} (${membership.clerkId}) - role: ${membership.role}, systemRole: ${membership.user.systemRole}`)
    })

    // 管理者権限を持つユーザーを特定
    console.log('\n=== 管理者権限を持つユーザー ===')
    const adminUsers = memberships.filter(m => m.role === 'admin')
    adminUsers.forEach(membership => {
      console.log(`- ${membership.user.email} (${membership.clerkId}) - role: ${membership.role}, systemRole: ${membership.user.systemRole}`)
    })

    // system_team権限を持つユーザーを特定
    console.log('\n=== system_team権限を持つユーザー ===')
    const systemTeamUsers = allUsers.filter(u => u.systemRole === 'system_team')
    systemTeamUsers.forEach(user => {
      console.log(`- ${user.email} (${user.clerkId}) - systemRole: ${user.systemRole}`)
    })

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentUser() 