import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_DEPARTMENTS = [
  { name: '経営', order: 1, isDefault: false },
  { name: 'エンジニア', order: 2, isDefault: false },
  { name: 'セールス', order: 3, isDefault: false },
  { name: 'マーケティング', order: 4, isDefault: false },
  { name: 'その他', order: 5, isDefault: true },
];

async function addDefaultDepartmentsToExistingOrganizations() {
  try {
    console.log('既存の組織にデフォルト部署を追加中...');

    // すべての組織を取得
    const organizations = await prisma.organization.findMany();
    console.log(`対象組織数: ${organizations.length}`);

    for (const organization of organizations) {
      console.log(`組織 "${organization.name}" (${organization.id}) を処理中...`);

      // 既存の部署を確認
      const existingDepartments = await prisma.organizationDepartment.findMany({
        where: { organizationId: organization.id }
      });

      if (existingDepartments.length === 0) {
        // 部署が存在しない場合のみデフォルト部署を作成
        console.log(`  デフォルト部署を作成中...`);
        
        await Promise.all(
          DEFAULT_DEPARTMENTS.map(dept =>
            prisma.organizationDepartment.create({
              data: {
                organizationId: organization.id,
                name: dept.name,
                order: dept.order,
                isDefault: dept.isDefault,
              },
            })
          )
        );
        
        console.log(`  デフォルト部署を作成しました`);
      } else {
        console.log(`  既に部署が存在するためスキップ (${existingDepartments.length}個)`);
        
        // 既存の部署がある場合、デフォルト部署が設定されているか確認
        const defaultDepartment = existingDepartments.find(dept => dept.isDefault);
        if (!defaultDepartment) {
          console.log(`  デフォルト部署が設定されていないため、「その他」部署をデフォルトに設定します`);
          
          // 「その他」部署を探してデフォルトに設定
          const otherDepartment = existingDepartments.find(dept => dept.name === 'その他');
          if (otherDepartment) {
            await prisma.organizationDepartment.update({
              where: { id: otherDepartment.id },
              data: { isDefault: true }
            });
            console.log(`  「その他」部署をデフォルトに設定しました`);
          } else {
            console.log(`  「その他」部署が見つからないため、新しく作成します`);
            await prisma.organizationDepartment.create({
              data: {
                organizationId: organization.id,
                name: 'その他',
                order: 5,
                isDefault: true,
              },
            });
            console.log(`  「その他」部署を作成し、デフォルトに設定しました`);
          }
        }
      }
    }

    console.log('デフォルト部署の追加が完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトを実行
addDefaultDepartmentsToExistingOrganizations(); 