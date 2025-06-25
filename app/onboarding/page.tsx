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

      if (organizationId && invitationId && !invitationAccepted) {
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
        }
      }

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
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-lg text-gray-700">ユーザー情報を読み込み中...</p>
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
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center bg-gray-100 p-12 text-center">
        <Image
          src="/blacklogo.svg"
          alt="nexana Illustration"
          width={300}
          height={300}
          priority
        />
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-gray-900">
          ようこそ ネクサナ へ
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          いくつかの簡単なステップで、あなたのプロフィールを完成させましょう。
        </p>
        </div>
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 w-5/6 mx-auto">
            <ol className="flex items-center w-full">
              {STEPS.map((step, stepIdx) => (
                <li
                  key={step.id}
                  className={`flex w-full items-center ${
                    stepIdx !== STEPS.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block" : ''
                  } ${
                    currentStep > step.id
                      ? 'text-blue-600 after:border-blue-600'
                      : 'after:border-gray-200'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                      currentStep >= step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </span>
                </li>
              ))}
            </ol>
        </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && 'あなたについて教えてください'}
                {currentStep === 2 && 'もう少しです'}
                {currentStep === 3 && '入力内容の確認'}
                  </CardTitle>
              <CardDescription>
                {currentStep === 1 && '姓名をそれぞれ入力してください。'}
                {currentStep === 2 && '生年月日と性別を選択してください。'}
                {currentStep === 3 &&
                  '入力内容に間違いがないかご確認ください。'}
              </CardDescription>
                </CardHeader>
            <CardContent>
              {currentStep === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastName">姓</Label>
                    <Input
                      id="lastName"
                      placeholder="例: 山田"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange('lastName', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">名</Label>
                    <Input
                      id="firstName"
                      placeholder="例: 太郎"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange('firstName', e.target.value)
                      }
                    />
                </div>
              </div>
            )}
            {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>生年月日</Label>
                      <DateSelect
                        value={formData.birthday}
                        onChange={(date) => handleInputChange('birthday', date)}
                      />
                    </div>
                  <div className="space-y-2">
                    <Label>性別</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="性別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">男性</SelectItem>
                        <SelectItem value="female">女性</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                        <SelectItem value="unanswered">無回答</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2 rounded-lg border p-4">
                    <div className="font-semibold text-gray-600">氏名</div>
                    <div className="col-span-2">
                      {formData.lastName} {formData.firstName}
                    </div>
                    <div className="font-semibold text-gray-600">生年月日</div>
                    <div className="col-span-2">
                      {formData.birthday?.toLocaleDateString()}
                    </div>
                    <div className="font-semibold text-gray-600">性別</div>
                    <div className="col-span-2">
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
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
              </div>
            )}
          </CardContent>
            <CardFooter className="flex justify-between">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  戻る
                </Button>
              ) : (
                <div />
              )}
              {currentStep < 3 ? (
                <Button onClick={handleNext}>
                  次へ <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
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
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingPageContent />
    </Suspense>
  );
} 