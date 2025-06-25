import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkSystemTeamRole } from '@/lib/auth/roles'

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // システムチーム権限チェック
    const isSystemTeam = await checkSystemTeamRole(userId);
    if (!isSystemTeam) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { name, address, managerName } = await req.json()
    
    const organization = await prisma.organization.create({
      data: {
        name,
        address,
        managerName
      }
    })
    
    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: '組織の作成に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // システムチーム権限チェック
    const isSystemTeam = await checkSystemTeamRole(userId);
    if (!isSystemTeam) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const organizations = await prisma.organization.findMany()
    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: '組織一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
} 