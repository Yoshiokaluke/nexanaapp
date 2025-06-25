export const AuthError = {
  UNAUTHORIZED: {
    message: '認証が必要です',
    code: 401
  },
  FORBIDDEN: {
    message: 'アクセス権限がありません',
    code: 403
  },
  NOT_FOUND: {
    message: 'リソースが見つかりません',
    code: 404
  },
  INTERNAL_ERROR: {
    message: '内部エラーが発生しました',
    code: 500
  }
} as const;

export type AuthErrorType = typeof AuthError[keyof typeof AuthError]; 