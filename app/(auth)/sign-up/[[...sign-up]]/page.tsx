import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignUp
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