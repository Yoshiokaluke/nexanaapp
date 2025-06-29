'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateSelect } from '@/components/ui/date-select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle } from 'lucide-react';

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, userId } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [invitationAccepted, setInvitationAccepted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: undefined as Date | undefined,
    gender: '',
  });

  const organizationId = searchParams.get('organization_id');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const redirectUrl = `/sign-in?redirect_url=${encodeURIComponent(
        window.location.href
      )}`;
      router.push(redirectUrl);
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        setIsFetchingProfile(true);
        try {
          // オンボーディング用のAPIエンドポイントからユーザー情報を取得
          const response = await fetch(`/api/users/me`);
          if (response.ok) {
            const userData = await response.json();
            const profileData = userData.profile;

            setFormData((prev) => ({
              ...prev,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              birthday: profileData?.birthday ? new Date(profileData.birthday) : undefined,
              gender: profileData?.gender || '',
            }));
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          toast.error('プロフィールの読み込みに失敗しました。');
        } finally {
          setIsFetchingProfile(false);
        }
      } else if (isLoaded) {
        setIsFetchingProfile(false);
      }
    };

    fetchUserProfile();
  }, [userId, isLoaded]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep1 = () => {
    return formData.firstName.trim() && formData.lastName.trim();
  };

  const validateStep2 = () => {
    return formData.birthday && formData.gender;
  };

  const validateBirthday = (date: Date | undefined): number => {
    if (!date) return 0;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      toast.error('氏名を入力してください');
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      toast.error('生年月日と性別を選択してください');
      return;
    }
    
    if (currentStep === 2 && formData.birthday) {
      const age = validateBirthday(formData.birthday);
      if (age < 13) {
        toast.error('13歳以上の方のみご利用いただけます');
        return;
      }
      if (age > 120) {
        toast.error('生年月日を正しく入力してください');
        return;
      }
    }
    
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error(
        '認証情報が見つかりません。ページの再読み込みをお試しください。'
      );
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await fetch('/api/auth/register', { method: 'POST' });

      // 氏名をUserテーブルに保存
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
      };
      
      const userResponse = await fetch(`/api/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!userResponse.ok) throw new Error('ユーザー情報の保存に失敗しました');

      // プロフィール情報をProfileテーブルに保存
      const profileData = {
        birthday: formData.birthday?.toISOString(),
        gender: formData.gender,
      };
      
      const profileResponse = await fetch(`/api/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!profileResponse.ok) throw new Error('プロフィールの保存に失敗しました');
      toast.success('プロフィールを保存しました');

      const invitationId = searchParams.get('invitation_id');
      const token = searchParams.get('token');

      // 組織への招待がある場合の処理
      if (organizationId && invitationId && !invitationAccepted) {
        console.log('Processing organization invitation...');
        
        try {
          const acceptResponse = await fetch(
            `/api/organizations/${organizationId}/invitation/${invitationId}/accept?token=${
              token || ''
            }`,
            { method: 'GET' }
          );
          
          if (!acceptResponse.ok) {
            const errorText = await acceptResponse.text();
            if (errorText.includes('既にこの組織のメンバーです')) {
              console.log('User is already a member, proceeding...');
              setInvitationAccepted(true);
            } else {
              throw new Error(errorText || '招待の受け入れに失敗しました');
            }
          } else {
            setInvitationAccepted(true);
            toast.success('組織への参加が完了しました！');
            
            // 招待の受け入れが成功した後、メンバーシップの確認を行う
            console.log('Verifying membership after invitation acceptance...');
            try {
              // 少し待機してからメンバーシップを確認
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const membershipCheckResponse = await fetch(`/api/organizations/${organizationId}/members/me`);
              if (membershipCheckResponse.ok) {
                console.log('Membership verification successful');
              } else {
                console.warn('Membership verification failed, but proceeding with redirect');
              }
            } catch (verificationError) {
              console.warn('Membership verification error:', verificationError);
              // 検証に失敗してもリダイレクトは続行
            }
          }
        } catch (invitationError) {
          console.error('Invitation acceptance error:', invitationError);
          // 招待の受け入れに失敗した場合でも、オンボーディングは続行
          toast.warning('招待の受け入れに問題がありましたが、プロフィールの保存は完了しました。');
        }
      }

      // リダイレクト処理
      if (organizationId) {
        const queryParams = new URLSearchParams({ from_invitation: 'true' });
        const profileEditUrl = `/organization/${organizationId}/OrganizationProfile/${userId}/edit?${queryParams.toString()}`;
        router.push(profileEditUrl);
      } else {
        router.push('/organization-list');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'プロフィールの保存に失敗しました';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || !userId || isFetchingProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1E1E1E]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4BEA8A]"></div>
          <p className="text-lg text-[#FFFFFF]">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  const STEPS = [
    { id: 1, name: '氏名' },
    { id: 2, name: '基本情報' },
    { id: 3, name: '最終確認' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#1E1E1E] lg:grid lg:grid-cols-2">
      {/* 左側のヒーローセクション */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] p-12 text-center relative overflow-hidden">
        {/* 背景の装飾的な要素 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-[#4BEA8A] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-[#4BEA8A] rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10">
          <Image
            src="/White.w.logo.svg"
            alt="nexana Logo"
            width={200}
            height={200}
            priority
            className="mb-8"
          />
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-[#FFFFFF] mb-4">
            ようこそ ネクサナ へ
          </h1>
          <p className="text-xl text-[#CCCCCC] leading-relaxed max-w-md">
            いくつかの簡単なステップで、あなたのプロフィールを完成させましょう。
          </p>
          
          {/* ステップインジケーター（左側にも表示） */}
          <div className="mt-12 w-full max-w-sm">
            <div className="text-left mb-4">
              <p className="text-[#4BEA8A] font-semibold text-sm uppercase tracking-wide">
                ステップ {currentStep} / 3
              </p>
            </div>
            <ol className="flex items-center w-full">
              {STEPS.map((step, stepIdx) => (
                <li
                  key={step.id}
                  className={`flex w-full items-center ${
                    stepIdx !== STEPS.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-2 after:inline-block" : ''
                  } ${
                    currentStep > step.id
                      ? 'text-[#4BEA8A] after:border-[#4BEA8A]'
                      : currentStep === step.id
                      ? 'text-[#4BEA8A] after:border-[#4BEA8A]'
                      : 'text-[#666666] after:border-[#444444]'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm font-medium ${
                      currentStep >= step.id
                        ? 'bg-[#4BEA8A] text-[#1E1E1E]'
                        : 'bg-[#333333] text-[#666666]'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* 右側のフォームセクション */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-[#1E1E1E]">
        <div className="w-full max-w-md">
          {/* モバイル用ステップインジケーター */}
          <div className="lg:hidden mb-8 w-full">
            <div className="text-center mb-4">
              <p className="text-[#4BEA8A] font-semibold text-sm uppercase tracking-wide">
                ステップ {currentStep} / 3
              </p>
            </div>
            <ol className="flex items-center w-full">
              {STEPS.map((step, stepIdx) => (
                <li
                  key={step.id}
                  className={`flex w-full items-center ${
                    stepIdx !== STEPS.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-2 after:inline-block" : ''
                  } ${
                    currentStep > step.id
                      ? 'text-[#4BEA8A] after:border-[#4BEA8A]'
                      : currentStep === step.id
                      ? 'text-[#4BEA8A] after:border-[#4BEA8A]'
                      : 'text-[#666666] after:border-[#444444]'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm font-medium ${
                      currentStep >= step.id
                        ? 'bg-[#4BEA8A] text-[#1E1E1E]'
                        : 'bg-[#333333] text-[#666666]'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <Card className="w-full bg-[#2A2A2A] border-[#444444] shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-[#FFFFFF] text-xl">
                {currentStep === 1 && 'あなたについて教えてください'}
                {currentStep === 2 && 'もう少しです'}
                {currentStep === 3 && '入力内容の確認'}
              </CardTitle>
              <CardDescription className="text-[#CCCCCC]">
                {currentStep === 1 && '姓名をそれぞれ入力してください。'}
                {currentStep === 2 && '生年月日と性別を選択してください。'}
                {currentStep === 3 &&
                  '入力内容に間違いがないかご確認ください。'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {currentStep === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#FFFFFF] font-medium">
                      姓
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="例: 山田"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange('lastName', e.target.value)
                      }
                      className="bg-[#333333] border-[#555555] text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[#FFFFFF] font-medium">
                      名
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="例: 太郎"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange('firstName', e.target.value)
                      }
                      className="bg-[#333333] border-[#555555] text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                    />
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[#FFFFFF] font-medium">生年月日</Label>
                    <DateSelect
                      value={formData.birthday}
                      onChange={(date) => handleInputChange('birthday', date)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#FFFFFF] font-medium">性別</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger className="bg-[#333333] border-[#555555] text-[#FFFFFF] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]">
                        <SelectValue placeholder="性別を選択" className="text-[#888888]" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#333333] border-[#555555]">
                        <SelectItem value="male" className="text-[#FFFFFF] hover:bg-[#444444]">男性</SelectItem>
                        <SelectItem value="female" className="text-[#FFFFFF] hover:bg-[#444444]">女性</SelectItem>
                        <SelectItem value="other" className="text-[#FFFFFF] hover:bg-[#444444]">その他</SelectItem>
                        <SelectItem value="unanswered" className="text-[#FFFFFF] hover:bg-[#444444]">無回答</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#555555] bg-[#333333] p-6">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
                      <div className="font-semibold text-[#4BEA8A]">氏名</div>
                      <div className="col-span-2 text-[#FFFFFF]">
                        {formData.lastName} {formData.firstName}
                      </div>
                      <div className="font-semibold text-[#4BEA8A]">生年月日</div>
                      <div className="col-span-2 text-[#FFFFFF]">
                        {formData.birthday?.toLocaleDateString()}
                      </div>
                      <div className="font-semibold text-[#4BEA8A]">性別</div>
                      <div className="col-span-2 text-[#FFFFFF]">
                        {
                          {
                            male: '男性',
                            female: '女性',
                            other: 'その他',
                            unanswered: '無回答',
                          }[formData.gender]
                        }
                      </div>
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-800">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between pt-6">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="border-[#555555] text-[#1E1E1E] bg-[#FFFFFF] hover:bg-[#F0F0F0] hover:border-[#666666]"
                >
                  戻る
                </Button>
              ) : (
                <div />
              )}
              {currentStep < 3 ? (
                <Button 
                  onClick={handleNext}
                  className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold"
                >
                  次へ <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold disabled:opacity-50"
                >
                  {isLoading ? '保存中...' : '登録して始める'}
                  {!isLoading && (
                    <CheckCircle className="ml-2 h-4 w-4" />
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#1E1E1E]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4BEA8A]"></div>
          <p className="text-lg text-[#FFFFFF]">読み込み中...</p>
        </div>
      </div>
    }>
      <OnboardingPageContent />
    </Suspense>
  );
}