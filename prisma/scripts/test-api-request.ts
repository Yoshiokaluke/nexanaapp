import fetch from 'node-fetch';

async function testAPIRequest() {
  try {
    console.log('APIリクエストテスト開始...');
    
    const organizationId = 'cmci81ehu0001lj04tpl0ht9y';
    const baseUrl = 'http://localhost:3000';
    
    // 1. 部署一覧取得テスト
    console.log('\n1. 部署一覧取得テスト');
    const getResponse = await fetch(`${baseUrl}/api/organizations/${organizationId}/departments`);
    console.log('GET レスポンス:', getResponse.status, getResponse.statusText);
    
    if (getResponse.ok) {
      const departments = await getResponse.json();
      console.log('部署一覧:', departments);
    } else {
      const error = await getResponse.text();
      console.log('エラー:', error);
    }
    
    // 2. 部署追加テスト（認証なし）
    console.log('\n2. 部署追加テスト（認証なし）');
    const postResponse = await fetch(`${baseUrl}/api/organizations/${organizationId}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'テスト部署' })
    });
    
    console.log('POST レスポンス:', postResponse.status, postResponse.statusText);
    
    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log('追加結果:', result);
    } else {
      const error = await postResponse.json();
      console.log('エラー詳細:', error);
    }
    
  } catch (error) {
    console.error('テストエラー:', error);
  }
}

testAPIRequest(); 