import { NextResponse } from 'next/server';

export async function GET() {
  // 環境変数の値をログに出力
  console.log('AWS_REGION:', process.env.AWS_REGION);
  console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '設定済み' : '未設定');
  console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '設定済み' : '未設定');
  console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
  console.log('NODE_ENV:', process.env.NODE_ENV);

  return NextResponse.json({
    awsRegion: process.env.AWS_REGION,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ? '設定済み' : '未設定',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? '設定済み' : '未設定',
    awsS3Bucket: process.env.AWS_S3_BUCKET,
    nodeEnv: process.env.NODE_ENV,
    message: '環境変数のテスト完了'
  });
} 