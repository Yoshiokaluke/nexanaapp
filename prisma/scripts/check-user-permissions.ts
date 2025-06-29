import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserPermissions() {
  try {
    console.log('ユーザー権限チェック開始...');
    
    const organizationId = 'cmci81ehu0001lj04tpl0ht9y';
    
    // 組織の情報を取得
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!organization) {
      console.log('組織が見つかりません');
      return;
    }
    
    console.log('組織名:', organization.name);
    console.log('組織ID:', organization.id);
    
    // メンバーシップ一覧
    console.log('\nメンバーシップ一覧:');
    organization.memberships.forEach(membership => {
      console.log(`- ${membership.user.email} (${membership.user.firstName} ${membership.user.lastName}): ${membership.role}`);
    });
    
    // 管理者権限を持つユーザー
    const admins = organization.memberships.filter(m => m.role === 'admin');
    console.log('\n管理者権限を持つユーザー:');
    admins.forEach(admin => {
      console.log(`- ${admin.user.email} (${admin.user.firstName} ${admin.user.lastName})`);
    });
    
    // システムチームメンバー
    const systemTeamUsers = await prisma.user.findMany({
      where: { systemRole: 'system_team' }
    });
    
    console.log('\nシステムチームメンバー:');
    systemTeamUsers.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
  } catch (error) {
    console.error('権限チェックエラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions(); 