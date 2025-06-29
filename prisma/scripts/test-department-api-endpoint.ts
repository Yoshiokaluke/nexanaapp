import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDepartmentAPIEndpoint() {
  try {
    console.log('部署APIエンドポイントテスト開始...');
    
    // テスト用の組織ID（nexana Innovator）
    const organizationId = 'cmci81ehu0001lj04tpl0ht9y';
    
    // 1. 部署一覧取得テスト
    console.log('\n1. 部署一覧取得テスト');
    const departments = await prisma.organizationDepartment.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' }
    });
    console.log('部署一覧:', departments.map(dept => ({ id: dept.id, name: dept.name, order: dept.order })));
    
    // 2. 最大順序取得テスト
    console.log('\n2. 最大順序取得テスト');
    const maxOrder = await prisma.organizationDepartment.aggregate({
      where: { organizationId },
      _max: { order: true }
    });
    console.log('最大順序:', maxOrder._max.order);
    
    // 3. 重複チェックテスト
    console.log('\n3. 重複チェックテスト');
    const testName = 'テスト部署';
    const exists = await prisma.organizationDepartment.findFirst({
      where: { organizationId, name: testName }
    });
    console.log(`部署名 "${testName}" の重複チェック:`, exists ? '存在する' : '存在しない');
    
    // 4. 部署作成テスト
    console.log('\n4. 部署作成テスト');
    const nextOrder = (maxOrder._max.order ?? -1) + 1;
    const newDepartment = await prisma.organizationDepartment.create({
      data: {
        organizationId,
        name: `テスト部署_${Date.now()}`,
        order: nextOrder
      }
    });
    console.log('作成された部署:', newDepartment);
    
    // 5. 作成した部署を削除
    console.log('\n5. テスト部署の削除');
    await prisma.organizationDepartment.delete({
      where: { id: newDepartment.id }
    });
    console.log('テスト部署を削除しました');
    
  } catch (error) {
    console.error('テストエラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDepartmentAPIEndpoint(); 