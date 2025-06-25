'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, User, LogOut, ChevronDown, Building2 } from 'lucide-react';
import Image from 'next/image';

export function OrganizationListHeader() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const handleProfileClick = () => {
    if (user) {
      setIsDropdownOpen(false);
      router.push(`/organization-list/users/${user.id}/profile`);
    }
  };

  const handleLogoClick = () => {
    router.push('/organization-list');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Image 
                src="/blacklogo.svg" 
                alt="NexanaApp" 
                width={120} 
                height={36} 
                priority 
                className="h-8 w-auto" 
              />
            </button>
            
            {/* ナビゲーションリンク */}
            <nav className="hidden md:flex items-center ml-8 space-x-6">
              <button
                onClick={() => router.push('/organization-list')}
                className="text-gray-700 hover:text-indigo-600 transition-colors duration-150 px-3 py-2 rounded-lg hover:bg-indigo-50 font-medium flex items-center space-x-2"
              >
                <Building2 className="h-4 w-4" />
                <span>ワークスペース</span>
              </button>
            </nav>
          </div>

          {/* デスクトップメニュー */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {/* プロフィール・設定ドロップダウン */}
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                        {getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block">{user?.fullName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User className="mr-2 h-4 w-4" />
                    プロフィール・設定
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleSignOut();
                    }} 
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* モバイルメニューボタン */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex items-center space-x-3 px-3 py-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                  {getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/organization-list');
                }}
                className="w-full justify-start px-3 py-2 text-sm"
              >
                <Building2 className="mr-2 h-4 w-4" />
                ワークスペース
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleProfileClick();
                }}
                className="w-full justify-start px-3 py-2 text-sm"
              >
                <User className="mr-2 h-4 w-4" />
                プロフィール・設定
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full justify-start px-3 py-2 text-sm text-red-600 hover:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 