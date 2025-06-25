import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const organizations = await prisma.organization.findMany();

  for (const org of organizations) {
    // 「その他」部署がなければ作成
    let otherDept = await prisma.organizationDepartment.findFirst({
      where: { organizationId: org.id, name: "その他" }
    });

    if (!otherDept) {
      otherDept = await prisma.organizationDepartment.create({
        data: {
          organizationId: org.id,
          name: "その他",
          order: 0,
        }
      });
    }

    // organizationDepartmentIdがnullのプロフィールに割り当て
    await prisma.organizationProfile.updateMany({
      where: {
        organizationId: org.id,
        organizationDepartmentId: undefined,
      },
      data: {
        organizationDepartmentId: otherDept.id,
      }
    });
  }
}

main().finally(() => prisma.$disconnect()); 