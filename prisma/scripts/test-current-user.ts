import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCurrentUser() {
  try {
    console.log('=== 現在のユーザー権限テスト ===')
    
    // 組織ID
    const organizationId = 'cmch1t5k10006tag48b7wck9k'
    console.log(`確認対象組織ID: ${organizationId}`)

    // 各ユーザーで権限チェックをテスト
    const testUsers = [
      'user_2z5nC8IwXNjOSffwQsLqscCACtj', // daiki.yoshioka16@gmail.com
      'user_2z1jHimbW1ARRPcMktmovMCcnfT', // yoshiokaluke@gmail.com
      'user_2z1ljGFNoPlTEq3Ww2fLUFPH5wj', // daiki.yoshioka@duotech.biz
      'user_2wCBETc5XIIgyIXWsOqVu3cUyvu', // daiki.yoshioka@nexanahq.com (system_team)
    ]

    for (const clerkId of testUsers) {
      console.log(`\n--- ユーザー ${clerkId} のテスト ---`)
      
      // ユーザー情報を取得
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: {
          id: true,
          clerkId: true,
          email: true,
          firstName: true,
          lastName: true,
          systemRole: true
        }
      })

      if (!user) {
        console.log('❌ ユーザーが見つかりません')
        continue
      }

      console.log('ユーザー情報:', {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        systemRole: user.systemRole
      })

      // メンバーシップを確認
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          clerkId,
          organizationId
        }
      })

      console.log('メンバーシップ:', membership ? {
        role: membership.role,
        createdAt: membership.createdAt
      } : 'なし')

      // 管理者権限チェック関数をテスト
      const { checkOrganizationAdmin } = await import('@/lib/auth/roles')
      const isAdmin = await checkOrganizationAdmin(clerkId, organizationId)
      console.log('管理者権限チェック結果:', isAdmin ? '✅ あり' : '❌ なし')
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCurrentUser() 