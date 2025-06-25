import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { systemTeamAuth } from '@/app/lib/middleware/systemTeamAuth';
import { createDefaultDepartments } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';

// 組織一覧の取得
export async function GET() {
  const authResult = await systemTeamAuth();
  if (authResult) return authResult;

  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            qrScanners: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error in GET /api/system-team/organizations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// 組織の作成
export async function POST(req: Request) {
  const authResult = await systemTeamAuth();
  if (authResult) return authResult;

  try {
    const { userId } = await auth();
    const { name, address, managerName } = await req.json();
    if (!name) {
      return new NextResponse('組織名は必須です', { status: 400 });
    }

    // トランザクションで組織の作成、メンバーシップの作成、デフォルト部署の作成を行う
    const organization = await prisma.$transaction(async (tx) => {
      // 組織の作成
      const org = await tx.organization.create({
        data: {
          name,
          address,
          managerName
        }
      });

      // 作成者を管理者として追加
      await tx.organizationMembership.create({
        data: {
          clerkId: userId!,
          organizationId: org.id,
          role: 'admin'
        }
      });

      // デフォルト部署を作成
      await Promise.all(
        [
          { name: '経営', order: 1 },
          { name: 'エンジニア', order: 2 },
          { name: 'セールス', order: 3 },
          { name: 'マーケティング', order: 4 },
          { name: 'その他', order: 5 },
        ].map(dept =>
          tx.organizationDepartment.create({
            data: {
              organizationId: org.id,
              name: dept.name,
              order: dept.order,
              isDefault: true,
            },
          })
        )
      );

      return org;
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error in POST /api/system-team/organizations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// 組織の更新
export async function PATCH(req: Request) {
  const authResult = await systemTeamAuth();
  if (authResult) return authResult;

  try {
    const { id, name, address, managerName } = await req.json();
    if (!id || !name) {
      return new NextResponse('組織IDと組織名は必須です', { status: 400 });
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name,
        address,
        managerName
      }
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error in PATCH /api/system-team/organizations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// 組織の削除
export async function DELETE(req: Request) {
  const authResult = await systemTeamAuth();
  if (authResult) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return new NextResponse('組織IDは必須です', { status: 400 });
    }

    // トランザクションで関連データを削除
    await prisma.$transaction([
      prisma.organizationMembership.deleteMany({
        where: { organizationId: id }
      }),
      prisma.organization.delete({
        where: { id }
      })
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/system-team/organizations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 