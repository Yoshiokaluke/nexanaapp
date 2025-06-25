import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteSpecificOrganizations() {
  try {
    const organizationIdsToDelete = [
      'cmc4k0ln40034ta5sz1dgr1nq',
      'cmc5is4iu000cta81l4jbeus6',
      'cmc5ixff80001talwrw5envx8',
      'cmc4iyc6a0001taqsy8ffhay8'
    ]

    console.log('=== 指定された組織を削除します ===')
    console.log('削除対象組織ID:', organizationIdsToDelete)

    for (const organizationId of organizationIdsToDelete) {
      console.log(`\n--- 組織ID ${organizationId} の削除処理を開始 ---`)
      
      // 組織を検索
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          profiles: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true
                }
              },
              organizationDepartment: true
            }
          },
          qrScanners: true,
          invitations: true,
          departments: true
        }
      })

      if (!organization) {
        console.log(`組織が見つかりません: ${organizationId}`)
        continue
      }

      console.log('削除対象組織情報:', {
        id: organization.id,
        name: organization.name,
        address: organization.address,
        managerName: organization.managerName,
        createdAt: organization.createdAt,
        membershipsCount: organization.memberships.length,
        profilesCount: organization.profiles.length,
        qrScannersCount: organization.qrScanners.length,
        invitationsCount: organization.invitations.length,
        departmentsCount: organization.departments.length
      })

      // 関連データの確認
      if (organization.memberships.length > 0) {
        console.log('関連する組織メンバーシップ:')
        organization.memberships.forEach(membership => {
          console.log(`  - ユーザー: ${membership.user.email} (${membership.user.firstName} ${membership.user.lastName}), ロール: ${membership.role}`)
        })
      }

      if (organization.profiles.length > 0) {
        console.log('関連する組織プロフィール:')
        organization.profiles.forEach(profile => {
          console.log(`  - ユーザー: ${profile.user.email}, 表示名: ${profile.displayName}, 部署: ${profile.organizationDepartment?.name || '未設定'}`)
        })
      }

      if (organization.qrScanners.length > 0) {
        console.log('関連するQRスキャナー:')
        organization.qrScanners.forEach(scanner => {
          console.log(`  - 名前: ${scanner.name}, 場所: ${scanner.location}, スキャナーID: ${scanner.scannerId}`)
        })
      }

      if (organization.invitations.length > 0) {
        console.log('関連する招待:', organization.invitations.length, '件')
        organization.invitations.forEach(invitation => {
          console.log(`  - メール: ${invitation.email}, ロール: ${invitation.role}, 期限: ${invitation.expiresAt}`)
        })
      }

      if (organization.departments.length > 0) {
        console.log('関連する部署:')
        organization.departments.forEach(department => {
          console.log(`  - 名前: ${department.name}, 順序: ${department.order}, デフォルト: ${department.isDefault}`)
        })
      }

      // 削除実行
      console.log('組織を削除します...')
      
      // 関連データを先に削除（CASCADE制約がある場合は不要だが、安全のため）
      await prisma.organizationMembership.deleteMany({
        where: { organizationId }
      })
      console.log('組織メンバーシップを削除しました')

      await prisma.organizationProfile.deleteMany({
        where: { organizationId }
      })
      console.log('組織プロフィールを削除しました')

      await prisma.qrScanner.deleteMany({
        where: { organizationId }
      })
      console.log('QRスキャナーを削除しました')

      await prisma.organizationInvitation.deleteMany({
        where: { organizationId }
      })
      console.log('招待を削除しました')

      await prisma.organizationDepartment.deleteMany({
        where: { organizationId }
      })
      console.log('部署を削除しました')

      // 組織を削除
      await prisma.organization.delete({
        where: { id: organizationId }
      })
      console.log(`組織を削除しました: ${organization.name} (${organizationId})`)
    }

    console.log('\n=== 削除処理が完了しました ===')
    
    // 削除後の確認
    console.log('\n=== 削除後の確認 ===')
    for (const organizationId of organizationIdsToDelete) {
      const remainingOrganization = await prisma.organization.findUnique({
        where: { id: organizationId }
      })
      if (remainingOrganization) {
        console.log(`⚠️  削除されていません: ${organizationId}`)
      } else {
        console.log(`✅ 削除完了: ${organizationId}`)
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteSpecificOrganizations() 