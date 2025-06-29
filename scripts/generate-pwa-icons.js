const fs = require('fs');
const path = require('path');

// SVGアイコンの内容
const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#1E1E1E"/>
  <rect x="96" y="96" width="320" height="320" rx="32" fill="#4BEA8A"/>
  <rect x="128" y="128" width="80" height="80" rx="8" fill="#1E1E1E"/>
  <rect x="224" y="128" width="80" height="80" rx="8" fill="#1E1E1E"/>
  <rect x="320" y="128" width="64" height="80" rx="8" fill="#1E1E1E"/>
  <rect x="128" y="224" width="80" height="80" rx="8" fill="#1E1E1E"/>
  <rect x="224" y="224" width="80" height="80" rx="8" fill="#1E1E1E"/>
  <rect x="320" y="224" width="64" height="80" rx="8" fill="#1E1E1E"/>
  <rect x="128" y="320" width="80" height="64" rx="8" fill="#1E1E1E"/>
  <rect x="224" y="320" width="80" height="64" rx="8" fill="#1E1E1E"/>
  <rect x="320" y="320" width="64" height="64" rx="8" fill="#1E1E1E"/>
</svg>`;

// アイコンファイルを生成
const publicDir = path.join(__dirname, '..', 'public');

// SVGアイコンを保存
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

console.log('PWAアイコンファイルが生成されました:');
console.log('- public/icon.svg');
console.log('');
console.log('注意: PNGアイコンファイル（icon-192x192.png, icon-512x512.png）は手動で生成する必要があります。');
console.log('SVGファイルをオンラインコンバーターでPNGに変換してください。');
console.log('');
console.log('推奨ツール:');
console.log('- https://convertio.co/svg-png/');
console.log('- https://cloudconvert.com/svg-to-png'); 