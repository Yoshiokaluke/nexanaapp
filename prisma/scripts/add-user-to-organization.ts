import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addUserToOrganization() {
  try {
    const userEmail = 'daiki.yoshioka16@gmail.com'
    const organizationId = 'cmc5is4iu000cta81l4jbeus6'
    const role = 'admin'

    console.log(`=== ${userEmail} を組織に追加 ===`)
    console.log(`組織ID: ${organizationId}`)
    console.log(`ロール: ${role}`)

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.log('ユーザーが見つかりません')
      return
    }

    console.log('ユーザー情報:', {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email
    })

    // 組織を取得
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      console.log('組織が見つかりません')
      return
    }

    console.log('組織情報:', {
      id: organization.id,
      name: organization.name
    })

    // 既存のメンバーシップをチェック
    const existingMembership = await prisma.organizationMembership.findFirst({
      where: {
        clerkId: user.clerkId,
        organizationId: organizationId
      }
    })

    if (existingMembership) {
      console.log('既存のメンバーシップが見つかりました:', {
        id: existingMembership.id,
        role: existingMembership.role
      })
      
      // ロールを更新
      const updatedMembership = await prisma.organizationMembership.update({
        where: { id: existingMembership.id },
        data: { role: role }
      })
      
      console.log('メンバーシップを更新しました:', {
        id: updatedMembership.id,
        role: updatedMembership.role
      })
    } else {
      // 新しいメンバーシップを作成
      const newMembership = await prisma.organizationMembership.create({
        data: {
          clerkId: user.clerkId,
          organizationId: organizationId,
          role: role
        }
      })
      
      console.log('新しいメンバーシップを作成しました:', {
        id: newMembership.id,
        role: newMembership.role
      })
    }

    // 確認
    const finalMembership = await prisma.organizationMembership.findFirst({
      where: {
        clerkId: user.clerkId,
        organizationId: organizationId
      },
      include: {
        organization: true
      }
    })

    console.log('\n=== 最終確認 ===')
    console.log('メンバーシップ情報:', {
      id: finalMembership?.id,
      organizationName: finalMembership?.organization.name,
      role: finalMembership?.role,
      createdAt: finalMembership?.createdAt
    })

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addUserToOrganization() 