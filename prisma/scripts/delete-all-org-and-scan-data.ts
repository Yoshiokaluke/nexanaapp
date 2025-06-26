import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllOrgAndScanData() {
  try {
    console.log('=== GetItemRecord テーブルの全データを削除 ===')
    await prisma.getItemRecord.deleteMany({})
    console.log('✅ GetItemRecord 全削除')

    console.log('=== ScanTogetherRecord テーブルの全データを削除 ===')
    await prisma.scanTogetherRecord.deleteMany({})
    console.log('✅ ScanTogetherRecord 全削除')

    console.log('=== ScanTogetherSession テーブルの全データを削除 ===')
    await prisma.scanTogetherSession.deleteMany({})
    console.log('✅ ScanTogetherSession 全削除')

    // Organization関連の子テーブルを先に削除
    console.log('=== OrganizationProfileQrCode テーブルの全データを削除 ===')
    await prisma.organizationProfileQrCode.deleteMany({})
    console.log('✅ OrganizationProfileQrCode 全削除')

    console.log('=== OrganizationProfile テーブルの全データを削除 ===')
    await prisma.organizationProfile.deleteMany({})
    console.log('✅ OrganizationProfile 全削除')

    console.log('=== OrganizationInvitation テーブルの全データを削除 ===')
    await prisma.organizationInvitation.deleteMany({})
    console.log('✅ OrganizationInvitation 全削除')

    console.log('=== OrganizationMembership テーブルの全データを削除 ===')
    await prisma.organizationMembership.deleteMany({})
    console.log('✅ OrganizationMembership 全削除')

    console.log('=== OrganizationDepartment テーブルの全データを削除 ===')
    await prisma.organizationDepartment.deleteMany({})
    console.log('✅ OrganizationDepartment 全削除')

    console.log('=== ScanPurpose テーブルの全データを削除 ===')
    await prisma.scanPurpose.deleteMany({})
    console.log('✅ ScanPurpose 全削除')

    console.log('=== QrScanner テーブルの全データを削除 ===')
    await prisma.qrScanner.deleteMany({})
    console.log('✅ QrScanner 全削除')

    console.log('=== Organization テーブルの全データを削除 ===')
    await prisma.organization.deleteMany({})
    console.log('✅ Organization 全削除')

    console.log('\n=== 全削除完了 ===')
  } catch (error) {
    console.error('削除処理中にエラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllOrgAndScanData() 