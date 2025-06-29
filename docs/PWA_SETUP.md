# PWA (Progressive Web App) 設定 - 無効化済み

## 概要

QRスキャナーアプリケーションのPWA（Progressive Web App）機能は現在無効化されています。

## 変更内容

### 1. PWA機能の無効化
- `manifest.json`の`display`を`browser`に変更
- Service Workerの登録を削除
- PWA関連のメタデータを削除
- PWAインストールプロンプトを削除

### 2. 理由
- iPadでホーム画面に追加した際のPWA仕様を避けるため
- 通常のブラウザ環境での動作に最適化

## 現在の設定

### manifest.json
```json
{
  "name": "NexanaApp QR Scanner",
  "short_name": "QR Scanner",
  "description": "QRコードスキャナーアプリケーション",
  "start_url": "/scanner",
  "display": "browser",
  "background_color": "#1E1E1E",
  "theme_color": "#4BEA8A",
  "orientation": "portrait-primary",
  "scope": "/scanner"
}
```

### 削除された機能
- Service Worker（オフライン対応）
- PWAインストールプロンプト
- スタンドアロンモード
- プッシュ通知

## ブラウザ対応

### 現在の対応
- Chrome (Android/Desktop)
- Safari (iOS/macOS)
- Firefox (全プラットフォーム)
- Edge (Windows)

### 動作環境
- 通常のブラウザ環境での動作
- カメラアクセス機能は維持
- QRコードスキャン機能は維持

## テスト方法

### 1. 開発環境でのテスト
```bash
npm run dev
# http://localhost:3000/scanner にアクセス
```

### 2. 機能確認
1. カメラアクセスが正常に動作するか
2. QRコードスキャンが正常に動作するか
3. 通常のブラウザ環境で問題なく動作するか

## 今後の改善点

1. **パフォーマンス最適化**
   - 画像の最適化
   - コード分割の改善

2. **ユーザビリティの向上**
   - カメラアクセスの改善
   - エラーハンドリングの強化

## 参考リンク

- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) 