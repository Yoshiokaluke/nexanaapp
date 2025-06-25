import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, checkOrganizationAdmin } from '@/lib/auth/roles';

export async function PATCH(req: NextRequest, { params }: { params: { organizationId: string, departmentId: string } }) {
  try {
    const { organizationId, departmentId } = params;
    console.log('部署編集リクエスト - 組織ID:', organizationId, '部署ID:', departmentId);

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
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const { name } = await req.json();
    console.log('リクエストボディ:', { name });

    if (!name) {
      console.log('バリデーションエラー: 部署名は必須です');
      return NextResponse.json({ error: '部署名は必須です' }, { status: 400 });
    }

    // 「その他」は編集不可
    const dept = await prisma.organizationDepartment.findUnique({ where: { id: departmentId } });
    if (!dept) {
      console.log('部署が見つかりません');
      return NextResponse.json({ error: '部署が見つかりません' }, { status: 404 });
    }

    if (dept.name === 'その他') {
      console.log('「その他」部署は編集できません');
      return NextResponse.json({ error: 'この部署は編集できません' }, { status: 400 });
    }

    // 同一組織内で重複禁止
    const exists = await prisma.organizationDepartment.findFirst({
      where: { organizationId, name, NOT: { id: departmentId } },
    });
    console.log('重複チェック:', exists);

    if (exists) {
      console.log('重複エラー: 同じ名前の部署が既に存在します');
      return NextResponse.json({ error: '同じ名前の部署が既に存在します' }, { status: 409 });
    }

    const updated = await prisma.organizationDepartment.update({
      where: { id: departmentId },
      data: { name },
    });
    console.log('更新した部署:', JSON.stringify(updated, null, 2));
    return NextResponse.json(updated);
  } catch (error) {
    console.error('部署編集エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { organizationId: string, departmentId: string } }) {
  try {
    const { organizationId, departmentId } = params;
    console.log('部署削除リクエスト - 組織ID:', organizationId, '部署ID:', departmentId);

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
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const dept = await prisma.organizationDepartment.findUnique({ where: { id: departmentId } });
    if (!dept) {
      console.log('部署が見つかりません');
      return NextResponse.json({ error: '部署が見つかりません' }, { status: 404 });
    }

    console.log('削除対象の部署:', JSON.stringify(dept, null, 2));

    // 「その他」部署の削除制限を削除（デフォルト部署でも削除可能にする）
    // if (dept.name === 'その他') {
    //   console.log('「その他」部署は削除できません');
    //   return NextResponse.json({ error: 'この部署は削除できません' }, { status: 400 });
    // }

    // 使用中の部署は削除不可
    const used = await prisma.organizationProfile.findFirst({ where: { organizationDepartmentId: departmentId } });
    if (used) {
      console.log('使用中の部署は削除できません');
      return NextResponse.json({ error: 'この部署は使用中のため削除できません' }, { status: 400 });
    }

    await prisma.organizationDepartment.delete({ where: { id: departmentId } });
    console.log('部署を削除しました');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('部署削除エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 