import { uploadToS3, deleteFromS3 } from '../../lib/s3';

async function testS3Connection() {
  try {
    console.log('=== S3接続テスト開始 ===');

    // 環境変数の確認
    console.log('環境変数確認:');
    console.log('- AWS_REGION:', process.env.AWS_REGION);
    console.log('- AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
    console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '設定済み' : '未設定');
    console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '設定済み' : '未設定');

    if (!process.env.AWS_S3_BUCKET) {
      console.error('❌ AWS_S3_BUCKET環境変数が設定されていません');
      return;
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('❌ AWS認証情報が設定されていません');
      return;
    }

    // テスト用のダミーデータを作成
    const testBuffer = Buffer.from('Hello S3!');
    const testKey = `test/connection-test-${Date.now()}.txt`;
    const testContentType = 'text/plain';
    
    console.log('テストファイル情報:');
    console.log('- Key:', testKey);
    console.log('- ContentType:', testContentType);
    console.log('- Buffer size:', testBuffer.length);

    // S3にアップロード
    console.log('S3にアップロード中...');
    const url = await uploadToS3(testBuffer, testKey, testContentType);
    console.log('✅ アップロード成功:', url);

    // 少し待ってから削除
    console.log('3秒後にファイルを削除します...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // S3から削除
    console.log('S3から削除中...');
    await deleteFromS3(url);
    console.log('✅ 削除成功');

    console.log('=== S3接続テスト完了 ===');
  } catch (error) {
    console.error('❌ S3接続テストエラー:', error);
    
    if (error instanceof Error) {
      console.error('エラー詳細:');
      console.error('- メッセージ:', error.message);
      console.error('- スタック:', error.stack);
    }
  }
}

testS3Connection(); 