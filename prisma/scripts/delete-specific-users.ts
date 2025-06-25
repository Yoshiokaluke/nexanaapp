import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteSpecificUsers() {
  try {
    const emailsToDelete = [
      'daiki.yoshioka16@gmail.com',
      'yoshiokaluke@gmail.com',
      'daiki.yoshioka@duotech.biz',
      'test@example.com'
    ]

    console.log('=== 指定されたユーザーを削除します ===')
    console.log('削除対象メールアドレス:', emailsToDelete)

    for (const email of emailsToDelete) {
      console.log(`\n--- ${email} の削除処理を開始 ---`)
      
      // ユーザーを検索
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: {
              organization: true
            }
          },
          organizationProfiles: true,
          profile: true,
          sentInvitations: true
        }
      })

      if (!user) {
        console.log(`ユーザーが見つかりません: ${email}`)
        continue
      }

      console.log('削除対象ユーザー情報:', {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole,
        membershipsCount: user.memberships.length,
        organizationProfilesCount: user.organizationProfiles.length,
        hasProfile: !!user.profile,
        sentInvitationsCount: user.sentInvitations.length
      })

      // 関連データの確認
      if (user.memberships.length > 0) {
        console.log('関連する組織メンバーシップ:')
        user.memberships.forEach(membership => {
          console.log(`  - 組織: ${membership.organization.name} (${membership.organizationId}), ロール: ${membership.role}`)
        })
      }

      if (user.organizationProfiles.length > 0) {
        console.log('関連する組織プロフィール:', user.organizationProfiles.length, '件')
      }

      if (user.profile) {
        console.log('関連するプロフィール情報あり')
      }

      if (user.sentInvitations.length > 0) {
        console.log('送信した招待:', user.sentInvitations.length, '件')
      }

      // 削除実行
      console.log('ユーザーを削除します...')
      
      // 関連データを先に削除（CASCADE制約がある場合は不要だが、安全のため）
      await prisma.organizationMembership.deleteMany({
        where: { clerkId: user.clerkId }
      })
      console.log('組織メンバーシップを削除しました')

      await prisma.organizationProfile.deleteMany({
        where: { clerkId: user.clerkId }
      })
      console.log('組織プロフィールを削除しました')

      await prisma.organizationInvitation.deleteMany({
        where: { invitedBy: user.id }
      })
      console.log('送信した招待を削除しました')

      // プロフィールを削除
      if (user.profile) {
        await prisma.profile.delete({
          where: { clerkId: user.clerkId }
        })
        console.log('プロフィールを削除しました')
      }

      // ユーザーを削除
      await prisma.user.delete({
        where: { id: user.id }
      })
      console.log(`ユーザーを削除しました: ${email}`)
    }

    console.log('\n=== 削除処理が完了しました ===')
    
    // 削除後の確認
    console.log('\n=== 削除後の確認 ===')
    for (const email of emailsToDelete) {
      const remainingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (remainingUser) {
        console.log(`⚠️  削除されていません: ${email}`)
      } else {
        console.log(`✅ 削除完了: ${email}`)
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteSpecificUsers() 