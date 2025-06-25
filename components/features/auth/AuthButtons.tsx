import { SignInButton, SignUpButton } from '@clerk/nextjs'

export const AuthButtons = () => {
  return (
    <div className="flex items-center gap-4">
      <SignInButton>
        <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
          ログイン
        </button>
      </SignInButton>
      <SignUpButton>
        <button className="px-4 py-2 text-sm font-medium text-white bg-slate-500 rounded-md hover:bg-slate-400">
          新規登録
        </button>
      </SignUpButton>
    </div>
  )
} 