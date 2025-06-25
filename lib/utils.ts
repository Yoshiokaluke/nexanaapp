import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthday: Date | null): number | null {
  if (!birthday) return null;
  
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function generatePassword(length: number): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// デフォルト部署の定義
export const DEFAULT_DEPARTMENTS = [
  { name: '経営', order: 1 },
  { name: 'エンジニア', order: 2 },
  { name: 'セールス', order: 3 },
  { name: 'マーケティング', order: 4 },
  { name: 'その他', order: 5 },
];

// 組織作成時にデフォルト部署を作成する関数
export async function createDefaultDepartments(organizationId: string) {
  const { prisma } = await import('@/lib/prisma');
  
  try {
    const departments = await Promise.all(
      DEFAULT_DEPARTMENTS.map(dept =>
        prisma.organizationDepartment.create({
          data: {
            organizationId,
            name: dept.name,
            order: dept.order,
            isDefault: true,
          },
        })
      )
    );
    
    console.log(`組織 ${organizationId} にデフォルト部署を作成しました:`, departments.length);
    return departments;
  } catch (error) {
    console.error('デフォルト部署作成エラー:', error);
    throw error;
  }
}
