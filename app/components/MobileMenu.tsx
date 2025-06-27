"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // メニューが開いている間はbodyのスクロールを無効にする
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // クリーンアップ関数
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESCキーでメニューを閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* ハンバーガーボタン */}
      <button 
        onClick={toggleMenu}
        className="text-white p-2 focus:outline-none"
        aria-label="メニューを開く"
      >
        <svg 
          className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            // 閉じるアイコン（X）
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          ) : (
            // ハンバーガーアイコン
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16M4 18h16" 
            />
          )}
        </svg>
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* メニューコンテンツ */}
      <div 
        className={`fixed top-0 right-0 h-full w-64 bg-[#2A2A2A] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-white font-semibold text-lg">メニュー</h2>
            <button 
              onClick={closeMenu}
              className="text-white p-2 hover:text-[#4BEA8A] transition-colors"
              aria-label="メニューを閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* メニューアイテム */}
          <nav className="flex-1 p-6">
            <div className="space-y-6">
              <Link 
                href="/sign-in" 
                onClick={closeMenu}
                className="block text-white hover:text-[#4BEA8A] transition-colors duration-200 font-medium text-lg py-3 border-b border-gray-700"
              >
                ログイン
              </Link>
              <Link 
                href="/sign-up" 
                onClick={closeMenu}
                className="block bg-[#4BEA8A] text-[#1E1E1E] px-6 py-3 rounded-full hover:bg-[#3DD879] transition-all duration-200 font-semibold text-center"
              >
                新規作成
              </Link>
            </div>
          </nav>

          {/* フッター */}
          <div className="p-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm text-center">
              © 2024 AppNexana
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 