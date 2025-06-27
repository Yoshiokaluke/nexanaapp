import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { AuthSync } from './components/auth/AuthSync'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexana App",
  description: "Organization management application",
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
        <body suppressHydrationWarning={true} className="bg-[#1E1E1E]">
          <AuthSync />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
