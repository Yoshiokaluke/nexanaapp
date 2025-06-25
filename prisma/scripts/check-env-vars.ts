import dotenv from 'dotenv';
import path from 'path';

// .envファイルを読み込み
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log('=== 環境変数チェック ===');
console.log('現在のディレクトリ:', process.cwd());
console.log('.envファイルパス:', envPath);

// S3関連の環境変数
console.log('\n--- S3設定 ---');
console.log('AWS_REGION:', process.env.AWS_REGION || '未設定');
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET || '未設定');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '設定済み' : '未設定');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '設定済み' : '未設定');

// データベース関連の環境変数
console.log('\n--- データベース設定 ---');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '設定済み' : '未設定');

// Clerk関連の環境変数
console.log('\n--- Clerk設定 ---');
console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '設定済み' : '未設定');
console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '設定済み' : '未設定');

// その他の環境変数
console.log('\n--- その他の設定 ---');
console.log('NODE_ENV:', process.env.NODE_ENV || '未設定');

// 必須環境変数のチェック
console.log('\n--- 必須環境変数チェック ---');
const requiredVars = [
  'AWS_REGION',
  'AWS_S3_BUCKET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

let allSet = true;
requiredVars.forEach(varName => {
  const isSet = !!process.env[varName];
  console.log(`${varName}: ${isSet ? '✅ 設定済み' : '❌ 未設定'}`);
  if (!isSet) allSet = false;
});

console.log(`\n${allSet ? '✅ すべての必須環境変数が設定されています' : '❌ 一部の環境変数が未設定です'}`); 