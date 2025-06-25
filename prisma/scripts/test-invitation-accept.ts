import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testInvitationAccept() {
  const invitationId = 'cmc5i6x270009tancxpicbih2'
  const organizationId = 'cmc4k0ln40034ta5sz1dgr1nq'
  const userEmail = 'yoshiokaluke@gmail.com'

  try {
    console.log('=== 招待受け入れ処理のテスト ===')
    
    // 1. ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.log('❌ ユーザーが見つかりません')
      return
    }

    console.log('ユーザー情報:', {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email
    })

    // 2. 招待を取得
    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId: organizationId
      }
    })

    if (!invitation) {
      console.log('❌ 招待が見つかりません')
      return
    }

    console.log('招待情報:', {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      token: invitation.token
    })

    // 3. 招待受け入れ処理をシミュレート
    console.log('\n=== 招待受け入れ処理の実行 ===')
    
    try {
      const result = await prisma.$transaction(async (tx) => {
        console.log('トランザクション開始')
        
        // 招待の存在と有効期限を確認
        const invitationCheck = await tx.organizationInvitation.findFirst({
          where: {
            id: invitationId,
            organizationId: organizationId,
          },
        });

        console.log('招待確認結果:', {
          found: !!invitationCheck,
          isExpired: invitationCheck ? invitationCheck.expiresAt < new Date() : null
        })

        if (!invitationCheck) {
          throw new Error('招待が見つかりません。招待の有効期限が切れているか、既に使用されている可能性があります。');
        }

        if (invitationCheck.expiresAt < new Date()) {
          console.log('招待期限切れ、削除中:', invitationId);
          await tx.organizationInvitation.delete({
            where: { id: invitationId }
          });
          throw new Error('招待の有効期限が切れています。新しい招待をリクエストしてください。');
        }

        // メール招待の場合は、メールアドレスの一致を確認
        if (invitationCheck.email && invitationCheck.email !== user.email) {
          throw new Error('招待されたメールアドレスと異なるアカウントでログインしています。');
        }

        // 既存のメンバーシップを確認
        const existingMembership = await tx.organizationMembership.findUnique({
          where: {
            clerkId_organizationId: {
              clerkId: user.clerkId,
              organizationId: organizationId,
            },
          },
        });

        console.log('既存メンバーシップ確認:', {
          found: !!existingMembership,
          clerkId: user.clerkId,
          organizationId: organizationId
        })

        if (existingMembership) {
          console.log('既にメンバー、招待を削除中');
          await tx.organizationInvitation.delete({
            where: { id: invitationId }
          });
          throw new Error('既にこの組織のメンバーです。招待は自動的に削除されました。');
        }

        console.log('メンバーシップ作成中:', {
          clerkId: user.clerkId,
          organizationId: organizationId,
          role: invitationCheck.role
        })

        // メンバーシップを作成
        const newMembership = await tx.organizationMembership.create({
          data: {
            clerkId: user.clerkId,
            organizationId: organizationId,
            role: invitationCheck.role
          },
        });

        console.log('メンバーシップ作成成功:', {
          id: newMembership.id,
          role: newMembership.role,
          createdAt: newMembership.createdAt
        })

        return { success: true, membership: newMembership };
      });

      console.log('✅ 招待受け入れ処理が成功しました')
      console.log('結果:', result)

    } catch (error) {
      console.error('❌ 招待受け入れ処理でエラーが発生:', error)
      if (error instanceof Error) {
        console.error('エラーメッセージ:', error.message)
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testInvitationAccept() 