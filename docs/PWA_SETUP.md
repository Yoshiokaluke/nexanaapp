# PWA (Progressive Web App) 設定

## 概要

QRスキャナーアプリケーションはPWA（Progressive Web App）として動作するように設定されています。

## 主な機能

### 1. オフライン対応
- Service Workerによるキャッシュ機能
- ネットワークが不安定な環境でも基本的な機能が利用可能

### 2. アプリインストール
- ホーム画面への追加が可能
- ネイティブアプリのような体験

### 3. プッシュ通知
- リアルタイム通知機能（将来実装予定）

## 設定ファイル

### manifest.json
```json
{
  "name": "NexanaApp QR Scanner",
  "short_name": "QR Scanner",
  "description": "QRコードスキャナーアプリケーション",
  "start_url": "/scanner",
  "display": "standalone",
  "background_color": "#1E1E1E",
  "theme_color": "#4BEA8A",
  "orientation": "portrait-primary",
  "scope": "/scanner"
}
```

### Service Worker (sw.js)
- キャッシュ戦略: ネットワークファースト（API）、キャッシュファースト（静的リソース）
- オフライン対応
- プッシュ通知対応

## アイコンファイル

### 必要なアイコンファイル
- `public/icon-192x192.png` (192x192px)
- `public/icon-512x512.png` (512x512px)
- `public/icon.svg` (ベクターアイコン)

### アイコン生成方法
```bash
# SVGアイコンを生成
node scripts/generate-pwa-icons.js

# PNGアイコンは手動で生成が必要
# 推奨ツール: https://convertio.co/svg-png/
```

## ブラウザ対応

### 完全対応
- Chrome (Android)
- Edge (Windows)
- Safari (iOS 11.3+)

### 部分対応
- Firefox (Android)
- Samsung Internet

## テスト方法

### 1. 開発環境でのテスト
```bash
npm run dev
# http://localhost:3000/scanner にアクセス
```

### 2. PWA機能の確認
1. Chrome DevTools → Application → Manifest
2. Service Workers タブで登録状況を確認
3. Lighthouse でPWAスコアを測定

### 3. インストールテスト
- Chrome: アドレスバーのインストールアイコン
- Safari: 共有ボタン → ホーム画面に追加

## トラブルシューティング

### Service Workerが登録されない
- HTTPS環境でテスト（localhostは除く）
- ブラウザのキャッシュをクリア

### インストールプロンプトが表示されない
- PWAの条件を満たしているか確認
- 既にインストール済みでないか確認

### オフラインで動作しない
- Service Workerのキャッシュ設定を確認
- ネットワークタブでキャッシュ状況を確認

## 今後の改善点

1. **プッシュ通知機能**
   - リアルタイム通知の実装
   - バックグラウンド同期

2. **オフライン機能の拡張**
   - より多くのリソースのキャッシュ
   - オフライン時のデータ同期

3. **パフォーマンス最適化**
   - 画像の最適化
   - コード分割の改善

## 参考リンク

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) 