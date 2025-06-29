import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, checkOrganizationMembership, checkOrganizationAdmin } from '@/lib/auth/roles';

// GET: 部署一覧取得
export async function GET(req: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const { organizationId } = await params;
    console.log('部署一覧取得リクエスト - 組織ID:', organizationId);

    const user = await getAuthenticatedUser();
    console.log('認証ユーザー:', JSON.stringify(user, null, 2));

    if (!user) {
      console.log('ユーザーが認証されていません');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 組織メンバーシップ権限をチェック（管理者権限ではなく）
    const hasAccess = await checkOrganizationMembership(user.clerkId, organizationId);
    console.log('組織メンバーシップ権限:', hasAccess);

    if (!hasAccess) {
      console.log('組織メンバーシップ権限がありません');
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const departments = await prisma.organizationDepartment.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
    });
    console.log('取得した部署一覧:', JSON.stringify(departments, null, 2));
    return NextResponse.json(departments);
  } catch (error) {
    console.error('部署一覧取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// POST: 部署追加
export async function POST(req: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const { organizationId } = await params;
    console.log('部署追加リクエスト - 組織ID:', organizationId);
    console.log('リクエストヘッダー:', Object.fromEntries(req.headers.entries()));

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

    let body;
    try {
      body = await req.json();
      console.log('リクエストボディ:', body);
    } catch (parseError) {
      console.error('JSONパースエラー:', parseError);
      return NextResponse.json({ error: 'リクエストボディの解析に失敗しました' }, { status: 400 });
    }
    
    const { name } = body;
    console.log('部署名:', name);

    if (!name || !name.trim()) {
      console.log('バリデーションエラー: 部署名は必須です');
      return NextResponse.json({ error: '部署名は必須です' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // 同一組織内で重複禁止
    const exists = await prisma.organizationDepartment.findFirst({
      where: { organizationId, name: trimmedName },
    });
    console.log('重複チェック:', exists);

    if (exists) {
      console.log('重複エラー: 同じ名前の部署が既に存在します');
      return NextResponse.json({ error: '同じ名前の部署が既に存在します' }, { status: 409 });
    }

    // 現在の最大順序を取得
    const maxOrder = await prisma.organizationDepartment.aggregate({
      where: { organizationId },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order ?? -1) + 1;
    console.log('次の順序:', nextOrder);

    const department = await prisma.organizationDepartment.create({
      data: { 
        organizationId, 
        name: trimmedName, 
        order: nextOrder
      },
    });
    console.log('作成した部署:', JSON.stringify(department, null, 2));
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('部署追加エラー:', error);
    
    // より詳細なエラー情報を返す
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'サーバーエラーが発生しました',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました',
      details: String(error)
    }, { status: 500 });
  }
} 