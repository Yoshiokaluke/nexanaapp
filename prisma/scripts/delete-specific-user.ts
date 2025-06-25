import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteUserByEmail(email: string) {
  try {
    console.log(`メールアドレス ${email} のユーザーを削除中...`)

    // ユーザーを検索
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        profile: true,
        sentInvitations: true,
        organizationProfiles: true,
      }
    })

    if (!user) {
      console.log(`メールアドレス ${email} のユーザーが見つかりませんでした。`)
      return
    }

    console.log('削除対象のユーザー情報:')
    console.log(`- ID: ${user.id}`)
    console.log(`- Email: ${user.email}`)
    console.log(`- Clerk ID: ${user.clerkId}`)
    console.log(`- プロファイル: ${user.profile ? 'あり' : 'なし'}`)
    console.log(`- 送信した招待数: ${user.sentInvitations.length}`)
    console.log(`- 組織プロファイル数: ${user.organizationProfiles.length}`)

    // 関連データを削除
    console.log('関連データを削除中...')

    // プロファイルを削除
    if (user.profile) {
      await prisma.profile.delete({
        where: { clerkId: user.clerkId }
      })
      console.log('プロファイルを削除しました')
    }

    // 送信した招待を削除
    if (user.sentInvitations.length > 0) {
      await prisma.organizationInvitation.deleteMany({
        where: { invitedBy: user.id }
      })
      console.log('送信した招待を削除しました')
    }

    // 組織プロファイルを削除
    if (user.organizationProfiles.length > 0) {
      await prisma.organizationProfile.deleteMany({
        where: { clerkId: user.clerkId }
      })
      console.log('組織プロファイルを削除しました')
    }

    // ユーザーを削除
    await prisma.user.delete({
      where: { id: user.id }
    })

    console.log(`ユーザー ${email} を正常に削除しました。`)

  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプト実行
const email = 'yoshiokaluke@gmail.com'
deleteUserByEmail(email) 