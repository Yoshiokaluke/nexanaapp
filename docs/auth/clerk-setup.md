# Clerk設定仕様

## 1. 認証プロバイダー設定

### 1.1 Google認証
```typescript
// 必要な権限スコープ
const GOOGLE_OAUTH_SCOPES = [
  'openid',
  'profile',
  'email'
];
```

### 1.2 Email/Password認証
- パスワードの最小長: 8文字
- 必須文字種: 大文字、小文字、数字
- 2要素認証: オプション（将来の拡張性のため）

## 2. サインアップフロー

### 2.1 必須項目
```typescript
interface SignUpData {
  // Clerk標準項目
  email: string;
  password?: string;  // Google認証の場合は不要
  
  // 追加収集項目
  firstName: string;
  lastName: string;
}
```

### 2.2 初期system-teamユーザー設定
```typescript
// prisma/seed.ts
const INITIAL_SYSTEM_TEAM_EMAIL = 'daiki.yoshioka@nexanahq.com';

async function seedSystemTeam() {
  const user = await prisma.user.findFirst({
    where: { email: INITIAL_SYSTEM_TEAM_EMAIL }
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { systemRole: 'system-team' }
    });
  }
}
```

## 3. Webhook設定

### 3.1 ユーザー作成時
```typescript
// app/api/webhooks/clerk/route.ts
export async function POST(req: Request) {
  const event = await req.json();
  
  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data;
    
    // DBへのユーザー情報保存
    await prisma.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0].email_address,
        name: `${first_name} ${last_name}`,
        systemRole: email === INITIAL_SYSTEM_TEAM_EMAIL ? 'system-team' : null
      }
    });
  }
}
```

## 4. 環境変数設定
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_****
CLERK_SECRET_KEY=sk_****
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/select-organization
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/select-organization

# System Config
SYSTEM_TEAM_EMAIL=daiki.yoshioka@nexanahq.com
```

## 5. 実装手順

1. **初期設定**
   - [ ] Clerkプロジェクト作成
   - [ ] 環境変数の設定
   - [ ] Google OAuth基本認証の設定

2. **認証ページ実装**
   - [ ] サインインページ
   - [ ] サインアップページ
   - [ ] Webhookエンドポイント

3. **初期データ設定**
   - [ ] システムチームユーザーの作成
   - [ ] DBマイグレーション実行
   - [ ] シードデータの投入 