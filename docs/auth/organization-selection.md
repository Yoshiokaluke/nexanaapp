# 組織選択画面仕様

## 1. データモデル

### 1.1 Organization
```typescript
interface Organization {
  id: string;
  name: string;
  imageUrl?: string;  // アイコン画像URL
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 OrganizationMembership
```typescript
interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}
```

## 2. UI仕様

### 2.1 表示項目
- 組織アイコン（デフォルトアイコンあり）
- 組織名
- ユーザーロール（admin/member）
- 最終アクセス日時（オプション）

### 2.2 レイアウト
```tsx
// app/select-organization/page.tsx
export default function OrganizationSelectionPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1>組織を選択</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            membership={memberships[org.id]}
            onSelect={() => handleSelect(org.id)}
          />
        ))}
      </div>
      
      {isSystemTeam && (
        <Button onClick={handleCreateOrg}>
          新規組織作成
        </Button>
      )}
    </div>
  );
}
```

### 2.3 コンポーネント
```tsx
// components/organization/OrganizationCard.tsx
interface OrganizationCardProps {
  organization: Organization;
  membership: OrganizationMembership;
  onSelect: () => void;
}

export function OrganizationCard({
  organization,
  membership,
  onSelect
}: OrganizationCardProps) {
  return (
    <div
      onClick={onSelect}
      className="p-4 border rounded-lg hover:shadow-md cursor-pointer"
    >
      <div className="flex items-center space-x-4">
        <Image
          src={organization.imageUrl || '/default-org-icon.png'}
          alt={organization.name}
          width={48}
          height={48}
          className="rounded-full"
        />
        <div>
          <h3 className="font-bold">{organization.name}</h3>
          <span className="text-sm text-gray-600">
            {membership.role === 'admin' ? '管理者' : 'メンバー'}
          </span>
        </div>
      </div>
    </div>
  );
}
```

## 3. 状態管理

### 3.1 Zustand Store
```typescript
// stores/organizationStore.ts
interface OrganizationStore {
  selectedOrganizationId: string | null;
  setSelectedOrganization: (id: string) => void;
  clearSelectedOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationStore>((set) => ({
  selectedOrganizationId: null,
  setSelectedOrganization: (id) => set({ selectedOrganizationId: id }),
  clearSelectedOrganization: () => set({ selectedOrganizationId: null }),
}));
```

## 4. 実装手順

1. **データベース設定**
   - [ ] Organizationテーブル作成
   - [ ] OrganizationMembershipテーブル作成
   - [ ] 初期データ投入

2. **UI実装**
   - [ ] OrganizationCardコンポーネント
   - [ ] 組織選択ページ
   - [ ] デフォルトアイコン準備

3. **状態管理**
   - [ ] Zustandストア実装
   - [ ] 組織選択時の処理
   - [ ] ルーティング制御 