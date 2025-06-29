import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'QRスキャナー - Appnexana',
  description: 'QRコードスキャナーアプリケーション',
  other: {
    'background-effects': 'disabled',
    'virtual-background': 'disabled',
    'background-blur': 'disabled'
  }
};

export const viewport: Viewport = {
  themeColor: '#4BEA8A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {children}
    </div>
  );
} 