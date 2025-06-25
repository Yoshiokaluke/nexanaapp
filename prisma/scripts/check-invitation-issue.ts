import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkInvitationIssue() {
  const invitationId = 'cmc5i6x270009tancxpicbih2'
  const organizationId = 'cmc4k0ln40034ta5sz1dgr1nq'
  const email = 'yoshiokaluke@gmail.com'

  try {
    console.log('=== 招待受け入れ問題の調査 ===')
    console.log(`招待ID: ${invitationId}`)
    console.log(`組織ID: ${organizationId}`)
    console.log(`メールアドレス: ${email}`)

    // 1. 招待情報を確認
    console.log('\n=== 招待情報の確認 ===')
    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId: organizationId
      }
    })

    if (invitation) {
      console.log('✅ 招待が見つかりました:')
      console.log(`- ID: ${invitation.id}`)
      console.log(`- Email: ${invitation.email}`)
      console.log(`- Role: ${invitation.role}`)
      console.log(`- ExpiresAt: ${invitation.expiresAt}`)
      console.log(`- Token: ${invitation.token}`)
      console.log(`- InvitedBy: ${invitation.invitedBy}`)
      console.log(`- CreatedAt: ${invitation.createdAt}`)
      console.log(`- UpdatedAt: ${invitation.updatedAt}`)
      console.log(`- 有効期限切れ: ${invitation.expiresAt < new Date()}`)
    } else {
      console.log('❌ 招待が見つかりません')
      return
    }

    // 2. ユーザー情報を確認
    console.log('\n=== ユーザー情報の確認 ===')
    const user = await prisma.user.findUnique({
      where: { email: email }
    })

    if (user) {
      console.log('✅ ユーザーが見つかりました:')
      console.log(`- ID: ${user.id}`)
      console.log(`- ClerkId: ${user.clerkId}`)
      console.log(`- Email: ${user.email}`)
      console.log(`- FirstName: ${user.firstName}`)
      console.log(`- LastName: ${user.lastName}`)
    } else {
      console.log('❌ ユーザーが見つかりません')
      console.log('全ユーザーを確認:')
      const allUsers = await prisma.user.findMany({
        select: { email: true, clerkId: true }
      })
      allUsers.forEach(u => console.log(`- ${u.email} (${u.clerkId})`))
      return
    }

    // 3. 既存のメンバーシップを確認
    console.log('\n=== 既存メンバーシップの確認 ===')
    const existingMembership = await prisma.organizationMembership.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId: user.clerkId,
          organizationId: organizationId
        }
      }
    })

    if (existingMembership) {
      console.log('⚠️ 既にメンバーシップが存在します:')
      console.log(`- ID: ${existingMembership.id}`)
      console.log(`- Role: ${existingMembership.role}`)
      console.log(`- CreatedAt: ${existingMembership.createdAt}`)
    } else {
      console.log('✅ メンバーシップは存在しません')
    }

    // 4. 組織情報を確認
    console.log('\n=== 組織情報の確認 ===')
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (organization) {
      console.log('✅ 組織が見つかりました:')
      console.log(`- ID: ${organization.id}`)
      console.log(`- Name: ${organization.name}`)
    } else {
      console.log('❌ 組織が見つかりません')
    }

    // 5. 招待者の情報を確認
    console.log('\n=== 招待者情報の確認 ===')
    const inviter = await prisma.user.findUnique({
      where: { id: invitation.invitedBy }
    })

    if (inviter) {
      console.log('✅ 招待者が見つかりました:')
      console.log(`- ID: ${inviter.id}`)
      console.log(`- Email: ${inviter.email}`)
    } else {
      console.log('❌ 招待者が見つかりません')
    }

    // 6. 問題の分析
    console.log('\n=== 問題の分析 ===')
    
    if (invitation.expiresAt < new Date()) {
      console.log('❌ 問題: 招待の有効期限が切れています')
    }
    
    if (invitation.email && invitation.email !== user.email) {
      console.log('❌ 問題: 招待されたメールアドレスとユーザーのメールアドレスが一致しません')
      console.log(`- 招待メール: ${invitation.email}`)
      console.log(`- ユーザーメール: ${user.email}`)
    }
    
    if (existingMembership) {
      console.log('❌ 問題: 既にメンバーシップが存在するため、新しいメンバーシップは作成されません')
    }

    if (!invitation.token && !invitation.email) {
      console.log('❌ 問題: 招待にトークンもメールアドレスも設定されていません')
    }

  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkInvitationIssue() 