import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { AuthSync } from './components/auth/AuthSync'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexana App - 組織管理とQRコードスキャン",
  description: "Nexana Appは、組織管理とQRコードスキャン機能を提供するWebアプリケーションです。イベント管理、メンバー招待、QRコード生成・スキャン、権限ベースのアクセス制御を簡単に行えます。",
  keywords: "組織管理, QRコード, イベント管理, メンバー招待, 権限管理, チーム管理, ビジネスアプリ",
  authors: [{ name: "Nexana Team" }],
  creator: "Nexana Team",
  publisher: "Nexana",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nexanahq.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Nexana App - 組織管理とQRコードスキャン",
    description: "組織管理とQRコードスキャン機能を提供するWebアプリケーション。イベント管理、メンバー招待、QRコード生成・スキャンを簡単に行えます。",
    url: 'https://nexanahq.com',
    siteName: 'Nexana App',
    images: [
      {
        url: '/180.png',
        width: 180,
        height: 180,
        alt: 'Nexana App Logo',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Nexana App - 組織管理とQRコードスキャン",
    description: "組織管理とQRコードスキャン機能を提供するWebアプリケーション",
    images: ['/180.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/48.png', sizes: '48x48', type: 'image/png' },
      { url: '/180.png', sizes: '180x180', type: 'image/png' },
    ],
    apple: [
      { url: '/180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nexana App',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl="/organization-list"
      afterSignUpUrl="/organization-list"
    >
      <html lang="ja" className={inter.className}>
        <head>
          {/* Safari用のfavicon設定 */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/48.png" type="image/png" sizes="48x48" />
          <link rel="icon" href="/180.png" type="image/png" sizes="180x180" />
          <link rel="apple-touch-icon" href="/180.png" />
          <link rel="apple-touch-icon-precomposed" href="/180.png" />
          <link rel="shortcut icon" href="/favicon.ico" />
          {/* Safari用の追加設定 */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Nexana App" />
          <link rel="apple-touch-startup-image" href="/180.png" />
          
          {/* SEO設定 */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#1E1E1E" />
          <meta name="color-scheme" content="dark" />
          
          {/* Google Search Console 検証用（必要に応じて追加） */}
          {/* Google Search Consoleで取得したHTMLタグを以下に追加してください */}
          {/* <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" /> */}
          
          {/* Google Analytics（必要に応じて追加） */}
          {/* <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'GA_MEASUREMENT_ID');
              `,
            }}
          /> */}
        </head>
        <body suppressHydrationWarning={true} className="bg-[#1E1E1E]">
          <AuthSync />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
