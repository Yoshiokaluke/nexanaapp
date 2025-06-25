import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { generatePassword } from '@/lib/utils';

// QRスキャナー一覧の取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: '組織IDが必要です' },
        { status: 400 }
      );
    }

    const qrScanners = await prisma.qrScanner.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(qrScanners);
  } catch (error) {
    console.error('Error fetching QR scanners:', error);
    return NextResponse.json(
      { error: 'QRスキャナーの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// QRスキャナーの作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, name, description, location }: {
      organizationId: string;
      name: string;
      description?: string;
      location: string;
    } = body;

    if (!organizationId || !name || !location) {
      return NextResponse.json(
        { error: '必須項目が不足しています', details: { organizationId, name, location } },
        { status: 400 }
      );
    }

    // 組織の存在確認
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: '指定された組織が存在しません', organizationId },
        { status: 404 }
      );
    }

    const scannerId = `SCN-${nanoid(8).toUpperCase()}`;
    const password = generatePassword(10);

    const qrScanner = await prisma.qrScanner.create({
      data: {
        organization: {
          connect: {
            id: organizationId
          }
        },
        name,
        description,
        location,
        scannerId,
        password,
        status: 'active',
      },
    });

    return NextResponse.json(qrScanner);
  } catch (error) {
    console.error('Error creating QR scanner:', error);
    return NextResponse.json(
      { 
        error: 'QRスキャナーの作成に失敗しました', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// QRスキャナーの更新
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, location, status, password } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'QRスキャナーIDが必要です' },
        { status: 400 }
      );
    }

    const qrScanner = await prisma.qrScanner.update({
      where: { id },
      data: {
        name,
        description,
        location,
        status,
        password,
      },
    });

    return NextResponse.json(qrScanner);
  } catch (error) {
    console.error('Error updating QR scanner:', error);
    return NextResponse.json(
      { error: 'QRスキャナーの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// QRスキャナーの削除
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'QRスキャナーIDが必要です' },
        { status: 400 }
      );
    }

    await prisma.qrScanner.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'QRスキャナーを削除しました' });
  } catch (error) {
    console.error('Error deleting QR scanner:', error);
    return NextResponse.json(
      { error: 'QRスキャナーの削除に失敗しました' },
      { status: 500 }
    );
  }
} 