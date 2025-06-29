import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDepartmentAPI() {
  try {
    console.log('データベース接続テスト開始...');
    
    // データベース接続テスト
    await prisma.$connect();
    console.log('データベース接続成功');
    
    // 組織の存在確認
    const organizations = await prisma.organization.findMany({
      take: 5,
      include: {
        departments: true
      }
    });
    
    console.log('組織一覧:', organizations.map(org => ({
      id: org.id,
      name: org.name,
      departmentCount: org.departments.length
    })));
    
    if (organizations.length === 0) {
      console.log('組織が存在しません');
      return;
    }
    
    const testOrg = organizations[0];
    console.log('テスト対象組織:', testOrg.name, testOrg.id);
    
    // 部署一覧取得テスト
    const departments = await prisma.organizationDepartment.findMany({
      where: { organizationId: testOrg.id },
      orderBy: { order: 'asc' }
    });
    
    console.log('現在の部署一覧:', departments);
    
    // 最大順序の確認
    const maxOrder = await prisma.organizationDepartment.aggregate({
      where: { organizationId: testOrg.id },
      _max: { order: true }
    });
    
    console.log('最大順序:', maxOrder._max.order);
    
  } catch (error) {
    console.error('テストエラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDepartmentAPI(); 