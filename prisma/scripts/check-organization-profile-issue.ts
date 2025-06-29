import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrganizationProfileIssue() {
  const organizationId = 'cmcetny4n001itavaxvtjtec7';
  const clerkId = 'user_2z5nC8IwXNjOSffwQsLqscCACtj';

  console.log('=== 組織プロフィール問題の診断 ===');
  console.log(`組織ID: ${organizationId}`);
  console.log(`ユーザーID: ${clerkId}`);

  try {
    // 1. ユーザーの存在確認
    console.log('\n=== ユーザー情報の確認 ===');
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (user) {
      console.log('✅ ユーザーが見つかりました:');
      console.log(`- ID: ${user.id}`);
      console.log(`- ClerkId: ${user.clerkId}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- FirstName: ${user.firstName}`);
      console.log(`- LastName: ${user.lastName}`);
      console.log(`- SystemRole: ${user.systemRole}`);
    } else {
      console.log('❌ ユーザーが見つかりません');
      return;
    }

    // 2. 組織の存在確認
    console.log('\n=== 組織情報の確認 ===');
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (organization) {
      console.log('✅ 組織が見つかりました:');
      console.log(`- ID: ${organization.id}`);
      console.log(`- Name: ${organization.name}`);
      console.log(`- Address: ${organization.address}`);
      console.log(`- ManagerName: ${organization.managerName}`);
    } else {
      console.log('❌ 組織が見つかりません');
      return;
    }

    // 3. メンバーシップの確認
    console.log('\n=== メンバーシップの確認 ===');
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId
        }
      }
    });

    if (membership) {
      console.log('✅ メンバーシップが見つかりました:');
      console.log(`- ID: ${membership.id}`);
      console.log(`- Role: ${membership.role}`);
      console.log(`- CreatedAt: ${membership.createdAt}`);
      console.log(`- UpdatedAt: ${membership.updatedAt}`);
    } else {
      console.log('❌ メンバーシップが見つかりません');
    }

    // 4. 組織プロフィールの確認
    console.log('\n=== 組織プロフィールの確認 ===');
    const organizationProfile = await prisma.organizationProfile.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId
        }
      },
      include: {
        organizationDepartment: true
      }
    });

    if (organizationProfile) {
      console.log('✅ 組織プロフィールが見つかりました:');
      console.log(`- ID: ${organizationProfile.id}`);
      console.log(`- DisplayName: ${organizationProfile.displayName}`);
      console.log(`- Introduction: ${organizationProfile.introduction}`);
      console.log(`- ProfileImage: ${organizationProfile.profileImage}`);
      console.log(`- Department: ${organizationProfile.organizationDepartment?.name || 'なし'}`);
      console.log(`- CreatedAt: ${organizationProfile.createdAt}`);
      console.log(`- UpdatedAt: ${organizationProfile.updatedAt}`);
    } else {
      console.log('❌ 組織プロフィールが見つかりません');
    }

    // 5. デフォルト部署の確認
    console.log('\n=== デフォルト部署の確認 ===');
    const defaultDepartment = await prisma.organizationDepartment.findFirst({
      where: {
        organizationId,
        isDefault: true
      }
    });

    if (defaultDepartment) {
      console.log('✅ デフォルト部署が見つかりました:');
      console.log(`- ID: ${defaultDepartment.id}`);
      console.log(`- Name: ${defaultDepartment.name}`);
      console.log(`- Order: ${defaultDepartment.order}`);
      console.log(`- IsDefault: ${defaultDepartment.isDefault}`);
    } else {
      console.log('❌ デフォルト部署が見つかりません');
      
      // 全部署を確認
      const allDepartments = await prisma.organizationDepartment.findMany({
        where: { organizationId }
      });
      
      if (allDepartments.length > 0) {
        console.log('利用可能な部署:');
        allDepartments.forEach(dept => {
          console.log(`- ${dept.name} (ID: ${dept.id}, Default: ${dept.isDefault})`);
        });
      } else {
        console.log('この組織には部署が設定されていません');
      }
    }

    // 6. 問題の解決策を提案
    console.log('\n=== 問題の解決策 ===');
    
    if (!membership) {
      console.log('❌ メンバーシップが存在しないため、まずメンバーシップを作成する必要があります');
    } else if (!organizationProfile) {
      console.log('❌ 組織プロフィールが存在しないため、作成する必要があります');
      
      if (defaultDepartment) {
        console.log('✅ デフォルト部署が存在するため、組織プロフィールを作成できます');
      } else {
        console.log('❌ デフォルト部署が存在しないため、まずデフォルト部署を作成する必要があります');
      }
    } else {
      console.log('✅ すべての必要なデータが存在します');
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganizationProfileIssue(); 