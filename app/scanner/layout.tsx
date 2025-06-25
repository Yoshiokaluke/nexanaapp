import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QRスキャナー - Appnexana',
  description: 'QRコードスキャナーアプリケーション',
  other: {
    'background-effects': 'disabled',
    'virtual-background': 'disabled',
    'background-blur': 'disabled'
  }
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  );
} 