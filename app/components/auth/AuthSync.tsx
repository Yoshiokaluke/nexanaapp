'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

// windowオブジェクトにカスタムプロパティの型定義を追加
declare global {
  interface Window {
    __DISABLE_AUTHSYNC__?: boolean;
  }
}

export function AuthSync() {
  const { isLoaded, userId, getToken } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncUser = async () => {
      // AuthSyncが無効化されている場合は実行しない
      if (typeof window !== 'undefined' && window.__DISABLE_AUTHSYNC__) {
        console.log('AuthSync: 無効化されているため実行しません');
        return;
      }

      // 既に同期済みの場合は実行しない
      if (hasSynced.current) {
        return;
      }

      console.log('AuthSync: 同期処理を開始します');
      console.log('AuthSync: isLoaded:', isLoaded);
      console.log('AuthSync: userId:', userId);

      if (!isLoaded) {
        console.log('AuthSync: 認証がまだ読み込まれていません');
        return;
      }

      if (!userId) {
        console.log('AuthSync: ユーザーが認証されていません');
        return;
      }

      try {
        console.log('AuthSync: トークンを取得します');
        const token = await getToken();
        console.log('AuthSync: トークン取得完了');

        console.log('AuthSync: ユーザー同期APIを呼び出します');
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('AuthSync: ユーザー同期に失敗しました:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
          return;
        }

        console.log('AuthSync: ユーザー同期が成功しました');
        // 同期成功フラグを設定
        hasSynced.current = true;
        
        // カスタムイベントを発火して同期完了を通知
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('authSyncComplete', {
            detail: { userId, success: true }
          }));
        }
      } catch (error) {
        console.error('AuthSync: ユーザー同期中にエラーが発生しました:', error);
      }
    };

    syncUser();
  }, [isLoaded, userId]);

  return null;
}