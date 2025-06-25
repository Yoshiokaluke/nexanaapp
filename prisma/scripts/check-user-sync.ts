import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUserSync() {
  try {
    console.log('=== daiki.yoshioka16@gmail.com のユーザー情報確認 ===')

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: 'daiki.yoshioka16@gmail.com' },
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    })

    if (!user) {
      console.log('ユーザーが見つかりません')
      return
    }

    console.log('ユーザー情報:', {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      systemRole: user.systemRole
    })
      
    console.log('\n=== 組織メンバーシップ情報 ===')
    if (user.memberships.length === 0) {
      console.log('組織メンバーシップがありません')
    } else {
      user.memberships.forEach(membership => {
        console.log({
          organizationId: membership.organizationId,
          organizationName: membership.organization.name,
          role: membership.role,
          createdAt: membership.createdAt
        })
      })
    }

    // 特定の組織IDでのメンバーシップ確認
    const targetOrgId = 'cmc5is4iu000cta81l4jbeus6'
    console.log(`\n=== 組織ID ${targetOrgId} でのメンバーシップ確認 ===`)
    
    const specificMembership = await prisma.organizationMembership.findFirst({
      where: {
        clerkId: user.clerkId,
        organizationId: targetOrgId
      }
    })

    if (specificMembership) {
      console.log('メンバーシップ情報:', {
        id: specificMembership.id,
        role: specificMembership.role,
        createdAt: specificMembership.createdAt
      })
    } else {
      console.log('この組織でのメンバーシップが見つかりません')
    }

    // 管理者権限チェック関数のテスト
    console.log('\n=== 管理者権限チェック関数のテスト ===')
    const { checkOrganizationAdmin } = await import('@/lib/auth/roles')
    const isAdmin = await checkOrganizationAdmin(user.clerkId, targetOrgId)
    console.log('管理者権限チェック結果:', isAdmin)

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserSync() 