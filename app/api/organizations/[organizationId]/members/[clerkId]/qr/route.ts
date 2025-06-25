import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { organizationAuth } from '@/app/lib/middleware/organizationAuth';

// QRコードデータの取得
export async function GET(
  req: Request,
  { params }: { params: { organizationId: string; clerkId: string } }
) {
  const authResult = await organizationAuth(params.organizationId);
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const { organizationId, clerkId } = params;

    // ユーザーが組織のメンバーであることを確認
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        clerkId_organizationId: {
          clerkId,
          organizationId,
        },
      },
    });

    if (!membership) {
      return new NextResponse('メンバーが見つかりません', { status: 404 });
    }

    // QRコードデータを生成（実際のQRコード生成ロジックは別途実装が必要）
    const qrData = {
      id: `qr_${clerkId}_${organizationId}`,
      userId: clerkId,
      organizationId: organizationId,
      qrCode: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${clerkId}/${organizationId}`,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(qrData);
  } catch (error) {
    console.error('Error in GET /api/organizations/[organizationId]/members/[clerkId]/qr:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 