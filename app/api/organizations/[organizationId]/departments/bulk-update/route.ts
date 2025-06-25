import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, checkOrganizationAdmin } from '@/lib/auth/roles';

export async function POST(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    console.log('部署一括更新リクエスト - 組織ID:', organizationId);

    const user = await getAuthenticatedUser();
    console.log('認証ユーザー:', JSON.stringify(user, null, 2));
    
    if (!user) {
      console.log('ユーザーが認証されていません');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isAdmin = await checkOrganizationAdmin(user.clerkId, organizationId);
    console.log('管理者権限:', isAdmin);

    if (!isAdmin) {
      console.log('管理者権限がありません');
      return new NextResponse('Forbidden', { status: 403 });
    }

    const departments = await req.json();
    console.log('更新対象の部署:', JSON.stringify(departments, null, 2));

    // トランザクションで一括更新
    await prisma.$transaction(
      departments.map((department: { id: string; order: number }) =>
        prisma.organizationDepartment.update({
          where: { id: department.id },
          data: { order: department.order },
        })
      )
    );

    console.log('部署の順序を更新しました');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('部署一括更新エラー:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 