import { s3Client } from '@/lib/s3';
import { GetBucketPolicyCommand, GetBucketAclCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

async function checkS3Bucket() {
  const bucketName = process.env.AWS_S3_BUCKET;
  
  console.log('=== S3バケット設定確認 ===');
  console.log('バケット名:', bucketName);
  console.log('リージョン:', process.env.AWS_REGION);
  console.log('アクセスキー:', process.env.AWS_ACCESS_KEY_ID ? '設定済み' : '未設定');
  console.log('シークレットキー:', process.env.AWS_SECRET_ACCESS_KEY ? '設定済み' : '未設定');

  if (!bucketName) {
    console.log('❌ AWS_S3_BUCKET環境変数が設定されていません');
    return;
  }

  try {
    // バケットポリシーを確認
    console.log('\n=== バケットポリシー確認 ===');
    try {
      const policyCommand = new GetBucketPolicyCommand({ Bucket: bucketName });
      const policyResponse = await s3Client.send(policyCommand);
      console.log('バケットポリシー:', policyResponse.Policy);
    } catch (error) {
      console.log('バケットポリシーなし:', error instanceof Error ? error.message : 'Unknown error');
    }

    // バケットACLを確認
    console.log('\n=== バケットACL確認 ===');
    try {
      const aclCommand = new GetBucketAclCommand({ Bucket: bucketName });
      const aclResponse = await s3Client.send(aclCommand);
      console.log('バケットACL:', aclResponse);
    } catch (error) {
      console.log('バケットACLエラー:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('\n=== 推奨設定 ===');
    console.log('1. バケットポリシーでパブリック読み取りアクセスを許可');
    console.log('2. または、署名付きURLを使用して画像を提供');
    console.log('3. または、CloudFrontを使用してCDN経由で画像を提供');

  } catch (error) {
    console.error('S3バケット確認エラー:', error);
  }
}

checkS3Bucket(); 