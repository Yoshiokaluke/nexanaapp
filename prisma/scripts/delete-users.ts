import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const targetEmails = [
  'yoshiokaluke@gmail.com',
  'daiki.yoshioka16@gmail.com',
  'daiki.yoshioka@duotech.biz',
]

async function deleteUsersByEmail() {
  try {
    for (const email of targetEmails) {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        console.log(`ユーザーが見つかりません: ${email}`)
        continue
      }
      console.log(`\n削除対象: ${email} (id: ${user.id}, clerkId: ${user.clerkId})`)

      try {
        await prisma.$transaction(async (tx) => {
          // OrganizationProfile
          const deletedProfiles = await tx.organizationProfile.deleteMany({ where: { clerkId: user.clerkId } })
          // OrganizationInvitation
          const deletedInvitations = await tx.organizationInvitation.deleteMany({ where: { invitedBy: user.id } })
          // OrganizationMembership
          const deletedMemberships = await tx.organizationMembership.deleteMany({ where: { clerkId: user.clerkId } })
          // User.organizationsリレーションは中間テーブルなので不要
          // Profile
          const deletedProfile = await tx.profile.deleteMany({ where: { clerkId: user.clerkId } })
          // User
          const deletedUser = await tx.user.delete({ where: { id: user.id } })

          console.log(`- OrganizationProfile: ${deletedProfiles.count}件削除`)
          console.log(`- OrganizationInvitation: ${deletedInvitations.count}件削除`)
          console.log(`- OrganizationMembership: ${deletedMemberships.count}件削除`)
          console.log(`- Profile: ${deletedProfile.count}件削除`)
          console.log(`✅ User: ${deletedUser.email} を削除しました`)
        })
      } catch (error) {
        if (error instanceof Error) {
          console.log(`❌ ${email} の削除に失敗: ${error.message}`)
        } else {
          console.log(`❌ ${email} の削除に失敗:`, error)
        }
      }
    }
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteUsersByEmail() 