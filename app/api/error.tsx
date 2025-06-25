'use client';

import { useEffect } from 'react';

export default function ApiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('API error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">APIエラーが発生しました</h1>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
} 