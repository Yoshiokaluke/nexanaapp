import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteOrganizations() {
  const organizationIds = [
    'cmc4lm4w50006tad4o33uandm',
    'cmc4lm66k000jtad4d14ocroi'
  ]

  try {
    console.log('削除対象のOrganization ID:')
    organizationIds.forEach(id => console.log(`- ${id}`))

    // 削除前に存在確認
    for (const id of organizationIds) {
      const org = await prisma.organization.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              memberships: true,
              departments: true,
              invitations: true,
              profiles: true,
              qrScanners: true
            }
          }
        }
      })

      if (org) {
        console.log(`\nOrganization "${org.name}" (${id}) の詳細:`)
        console.log(`- メンバー数: ${org._count.memberships}`)
        console.log(`- 部署数: ${org._count.departments}`)
        console.log(`- 招待数: ${org._count.invitations}`)
        console.log(`- プロフィール数: ${org._count.profiles}`)
        console.log(`- QRスキャナー数: ${org._count.qrScanners}`)
      } else {
        console.log(`\nOrganization ID ${id} は存在しません`)
      }
    }

    console.log('\n関連レコードを削除してからOrganizationを削除します...')

    // 各Organizationに対して関連レコードを削除
    for (const id of organizationIds) {
      console.log(`\n${id} の関連レコードを削除中...`)
      
      try {
        // トランザクション内で削除
        await prisma.$transaction(async (tx) => {
          // 1. OrganizationProfileを削除
          const deletedProfiles = await tx.organizationProfile.deleteMany({
            where: { organizationId: id }
          })
          console.log(`- OrganizationProfile: ${deletedProfiles.count}件削除`)

          // 2. OrganizationInvitationを削除
          const deletedInvitations = await tx.organizationInvitation.deleteMany({
            where: { organizationId: id }
          })
          console.log(`- OrganizationInvitation: ${deletedInvitations.count}件削除`)

          // 3. OrganizationMembershipを削除
          const deletedMemberships = await tx.organizationMembership.deleteMany({
            where: { organizationId: id }
          })
          console.log(`- OrganizationMembership: ${deletedMemberships.count}件削除`)

          // 4. QrScannerを削除
          const deletedScanners = await tx.qrScanner.deleteMany({
            where: { organizationId: id }
          })
          console.log(`- QrScanner: ${deletedScanners.count}件削除`)

          // 5. OrganizationDepartmentを削除
          const deletedDepartments = await tx.organizationDepartment.deleteMany({
            where: { organizationId: id }
          })
          console.log(`- OrganizationDepartment: ${deletedDepartments.count}件削除`)

          // 6. Organizationを削除
          const deletedOrg = await tx.organization.delete({
            where: { id }
          })
          console.log(`✅ Organization "${deletedOrg.name}" を削除しました`)
        })

      } catch (error) {
        if (error instanceof Error) {
          console.log(`❌ ${id} の削除に失敗: ${error.message}`)
        } else {
          console.log(`❌ ${id} の削除に失敗:`, error)
        }
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteOrganizations() 