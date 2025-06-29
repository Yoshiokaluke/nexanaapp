import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'QRスキャナー - Appnexana',
  description: 'QRコードスキャナーアプリケーション',
  manifest: '/manifest.json',
  themeColor: '#4BEA8A',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QR Scanner'
  },
  other: {
    'background-effects': 'disabled',
    'virtual-background': 'disabled',
    'background-blur': 'disabled',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default'
  }
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="register-sw"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `,
        }}
      />
      <div className="min-h-screen bg-[#1E1E1E]">
        {children}
      </div>
    </>
  );
} 