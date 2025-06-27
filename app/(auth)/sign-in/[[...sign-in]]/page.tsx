'use client';

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url');

  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn
        redirectUrl={redirectUrl || '/organization-list'}
        appearance={{
          elements: {
            formButtonPrimary: 'bg-slate-500 hover:bg-slate-400',
            footerActionLink: 'text-slate-500 hover:text-slate-400',
          },
        }}
      />
    </div>
  )
} 