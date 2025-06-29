'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Pencil, User, Upload, X, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type OrganizationProfile = {
  id: string;
  clerkId: string;
  organizationId: string;
  displayName: string | null;
  organizationDepartmentId: string;
  introduction: string | null;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
  organizationDepartment?: {
    id: string;
    name: string;
  };
};

type UserData = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

// ボタン共通スタイル
const ActionButtons = ({
  onSave,
  onCancel,
  disabled,
}: {
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) => (
  <div className="flex justify-end gap-2 mt-2">
    <Button
      type="button"
      variant="default"
      size="sm"
      onClick={onSave}
      disabled={disabled}
      className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold"
    >
      保存
    </Button>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCancel}
      disabled={disabled}
      className="flex-1 border-[#CCCCCC] bg-[#F5F5F5] text-black hover:bg-[#E0E0E0] hover:text-black hover:border-[#CCCCCC]"
    >
      キャンセル
    </Button>
  </div>
);

// 部署リスト取得用フック
function useDepartments(organizationId: string) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/organizations/${organizationId}/departments`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // データが配列であることを確認
        if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          console.error('API response is not an array:', data);
          setDepartments([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('部署取得エラー:', error);
        setDepartments([]);
        setLoading(false);
      });
  }, [organizationId]);
  return { departments, loading };
}

export default function OrganizationProfileEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: clerkUser } = useUser();
  const [organizationProfile, setOrganizationProfile] =
    useState<OrganizationProfile | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [isEditingIntroduction, setIsEditingIntroduction] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState('');
  const [
    editingOrganizationDepartmentId,
    setEditingOrganizationDepartmentId,
  ] = useState<string>('');
  const [editingIntroduction, setEditingIntroduction] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);

  // 招待フローからの誘導かどうかをチェック
  const isFromInvitation = searchParams.get('from_invitation') === 'true';
  const invitationId = searchParams.get('invitation_id');
  const token = searchParams.get('token');

  useEffect(() => {
    console.log('=== ページ初期化 ===');
    console.log('現在のユーザー:', clerkUser);
    console.log('URLパラメータ:', params);
    console.log('ユーザーID比較:', {
      currentUserId: clerkUser?.id,
      targetUserId: params.clerkId,
      isMatch: clerkUser?.id === params.clerkId
    });
    
    checkAccessAndFetchData();
  }, [params.organizationId, params.clerkId]);

  // 招待を受け入れる処理
  const acceptInvitation = async () => {
    if (!invitationId || !token) return;

    try {
      console.log('招待を受け入れます');
      const acceptResponse = await fetch(`/api/organizations/${params.organizationId}/invitation/${invitationId}/accept?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (acceptResponse.ok) {
        toast.success('組織に参加しました');
        return true;
      } else {
        const errorText = await acceptResponse.text();
        console.error('招待受け入れに失敗:', acceptResponse.status, errorText);
        toast.error(`招待の受け入れに失敗しました: ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('招待受け入れエラー:', error);
      toast.error('招待の受け入れに失敗しました');
      return false;
    }
  };

  const checkAccessAndFetchData = async () => {
    try {
      console.log('=== アクセスチェック開始 ===');
      console.log('現在のユーザーID:', clerkUser?.id);
      console.log('対象ユーザーID:', params.clerkId);
      
      // 権限チェック: 現在のユーザーと編集対象のユーザーが一致する場合のみ
      if (clerkUser?.id !== params.clerkId) {
        console.log('❌ 権限エラー: 自分のプロフィールのみ編集できます');
        toast.error('自分のプロフィールのみ編集できます');
        router.push(`/organization/${params.organizationId}/OrganizationProfile/${params.clerkId}`);
        return;
      }

      console.log('✅ 権限チェック通過');

      // 組織メンバーシップの確認
      console.log('組織メンバーシップ確認開始');
      const accessResponse = await fetch(`/api/auth/check-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: params.organizationId,
          targetClerkId: params.clerkId,
        }),
      });

      console.log('アクセス確認レスポンス:', {
        status: accessResponse.status,
        ok: accessResponse.ok
      });

      if (!accessResponse.ok) {
        console.log('❌ アクセス権限がありません');
        toast.error('アクセス権限がありません');
        router.push(`/organization/${params.organizationId}/OrganizationProfile`);
        return;
      }
      
      console.log('✅ アクセス権限確認完了');
      setHasAccess(true);

      // 組織情報の取得
      const orgResponse = await fetch(`/api/organizations/${params.organizationId}`);
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganizationName(orgData.name);
      }

      // 組織プロフィールの取得
      console.log('組織プロフィール取得開始:', {
        organizationId: params.organizationId,
        clerkId: params.clerkId
      });
      
      const profileResponse = await fetch(
        `/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile`
      );
      
      console.log('組織プロフィールレスポンス:', {
        status: profileResponse.status,
        ok: profileResponse.ok
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('組織プロフィールデータ:', profileData);
        setOrganizationProfile(profileData);
        setEditingDisplayName(profileData.displayName || '');
        if (!profileData.id) {
          setEditingOrganizationDepartmentId('');
        } else {
          setEditingOrganizationDepartmentId(profileData.organizationDepartmentId || '');
        }
        setEditingIntroduction(profileData.introduction || '');
      } else {
        console.error('組織プロフィール取得エラー:', profileResponse.status, await profileResponse.text());
      }

      // ユーザー情報の取得
      console.log('ユーザー情報取得開始');
      const userResponse = await fetch(`/api/users/${params.clerkId}/profile?organizationId=${params.organizationId}`);
      console.log('ユーザー情報レスポンス:', {
        status: userResponse.status,
        ok: userResponse.ok
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('ユーザー情報データ:', userData);
        setUser(userData);
      } else {
        console.error('ユーザー情報取得エラー:', userResponse.status, await userResponse.text());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const checkRequiredFields = () => {
    if (!organizationProfile) return { isComplete: false, missingFields: [] };
    
    const missingFields = [];
    if (!organizationProfile.displayName) missingFields.push('表示名');
    if (!organizationProfile.organizationDepartmentId) missingFields.push('部署');
    
    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  };

  const handleRequiredFieldsComplete = async () => {
    if (!invitationId || !token) return;
    
    const success = await acceptInvitation();
    if (success) {
      router.push(`/organization/${params.organizationId}`);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!organizationProfile) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editingDisplayName }),
      });

      if (!response.ok) throw new Error('表示名の保存に失敗しました');

      const updatedProfile = await response.json();
      setOrganizationProfile(updatedProfile);
      setIsEditingDisplayName(false);
      toast.success('表示名を保存しました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '表示名の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDepartment = async () => {
    if (!organizationProfile) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationDepartmentId: editingOrganizationDepartmentId }),
      });

      if (!response.ok) throw new Error('部署の保存に失敗しました');

      const updatedProfile = await response.json();
      setOrganizationProfile(updatedProfile);
      setIsEditingDepartment(false);
      toast.success('部署を保存しました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '部署の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIntroduction = async () => {
    if (!organizationProfile) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ introduction: editingIntroduction }),
      });

      if (!response.ok) throw new Error('自己紹介の保存に失敗しました');

      const updatedProfile = await response.json();
      setOrganizationProfile(updatedProfile);
      setIsEditingIntroduction(false);
      toast.success('自己紹介を保存しました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '自己紹介の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async () => {
    if (!previewImage) return;

    setIsUploading(true);
    try {
      // Base64データをBlobに変換
      const response = await fetch(previewImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, 'profile-image.jpg');

      console.log('画像アップロード開始');
      const uploadResponse = await fetch(`/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile/image`, {
        method: 'POST',
        body: formData,
      });

      console.log('画像アップロードレスポンス:', {
        status: uploadResponse.status,
        ok: uploadResponse.ok
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('画像アップロードエラー:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          errorText: errorText
        });
        throw new Error(`画像のアップロードに失敗しました: ${errorText}`);
      }

      const updatedProfile = await uploadResponse.json();
      console.log('更新後のプロフィール:', updatedProfile);
      
      setOrganizationProfile(updatedProfile);
      setPreviewImage(null);
      setIsEditingImage(false);
      toast.success('プロフィール画像を保存しました');
    } catch (error) {
      console.error('画像保存エラー:', error);
      toast.error(error instanceof Error ? error.message : '画像の保存に失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelImage = () => {
    setPreviewImage(null);
    setIsEditingImage(false);
  };

  const handleImageDelete = async () => {
    if (!organizationProfile?.profileImage) return;

    setIsUploading(true);
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: null }),
      });

      if (!response.ok) throw new Error('画像の削除に失敗しました');
      const updatedProfile = await response.json();
      setOrganizationProfile(updatedProfile); // ここでStateを更新
      toast.success('画像を削除しました');
      handleCancelImage(); // プレビューと編集モードをリセット
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '画像の削除に失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4BEA8A]"></div>
          <p className="text-lg text-[#FFFFFF]">プロフィール情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess || !organizationProfile || !user) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-[#FFFFFF]">
            プロフィールが見つかりません
          </h2>
          <Button 
            onClick={() => router.push(`/organization/${params.organizationId}/OrganizationProfile`)}
            className="bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold"
          >
            メンバー一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  const imageUrl = previewImage
    ? previewImage
    : organizationProfile.profileImage
    ? `${organizationProfile.profileImage}?v=${new Date(
        organizationProfile.updatedAt
      ).getTime()}`
    : '';

  // 必須項目の完了状況
  const requiredFieldsStatus = checkRequiredFields();
  const canProceed = requiredFieldsStatus.isComplete;

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {!isFromInvitation && (
              <Link 
                href={`/organization/${params.organizationId}/OrganizationProfile/${params.clerkId}`}
                className="text-[#4BEA8A] hover:text-[#3DD879] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-[#FFFFFF]">
              {organizationName}
            </h1>
          </div>
          <p className="text-[#CCCCCC] text-lg">プロフィール設定</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左側: プロフィール画像 */}
          <div className="md:col-span-1">
            <Card className="bg-[#2A2A2A] border-[#444444] shadow-xl">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar
                      key={organizationProfile.updatedAt}
                      className="w-32 h-32 mx-auto mb-4 ring-4 ring-[#4BEA8A]/30"
                    >
                      <AvatarImage src={imageUrl} alt="プロフィール画像" />
                      <AvatarFallback className="bg-gradient-to-br from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E]">
                        <User className="w-12 h-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-4 space-y-2">
                      {previewImage ? (
                        <div className="space-y-2">
                          <div className="text-sm text-[#4BEA8A] mb-2 font-medium">
                            プレビュー
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveImage}
                              disabled={isUploading}
                              size="sm"
                              className="flex-1 bg-[#4BEA8A] text-[#1E1E1E] hover:bg-[#3DD879] font-semibold"
                            >
                              {isUploading ? '保存中...' : '保存'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleCancelImage}
                              disabled={isUploading}
                              size="sm"
                              className="flex-1 border-[#CCCCCC] bg-[#F5F5F5] text-black hover:bg-[#E0E0E0] hover:text-black hover:border-[#CCCCCC]"
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      ) : isEditingImage ? (
                        <div className="space-y-2">
                          <label className="cursor-pointer w-full inline-flex items-center justify-center px-4 py-2 bg-[#4BEA8A] text-[#1E1E1E] rounded-md hover:bg-[#3DD879] transition-colors font-semibold">
                            <Upload className="w-4 h-4 mr-2" />
                            画像を変更
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={isUploading}
                            />
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleImageDelete}
                            disabled={isUploading}
                            className="w-full border-[#555555] bg-[#fff] text-[#222] hover:bg-[#f0f0f0] hover:text-[#111] font-semibold"
                          >
                            <X className="w-4 h-4 mr-2 text-[#222]" />
                            画像を削除
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingImage(false)}
                            disabled={isUploading}
                            className="w-full text-[#CCCCCC] hover:text-[#FFFFFF] hover:bg-[#333333]"
                          >
                            キャンセル
                          </Button>
                        </div>
                      ) : organizationProfile.profileImage ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingImage(true)}
                          className="w-full border-[#555555] bg-[#fff] text-[#222] hover:bg-[#f0f0f0] hover:text-[#111] font-semibold"
                        >
                          <Pencil className="w-4 h-4 mr-2 text-[#222]" />
                          画像を編集
                        </Button>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-[#4BEA8A] text-[#1E1E1E] rounded-md hover:bg-[#3DD879] transition-colors font-semibold">
                          <Upload className="w-4 h-4 mr-2" />
                          画像をアップロード
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-[#CCCCCC]">
                    <Mail className="w-4 h-4 text-[#4BEA8A]" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#CCCCCC]">
                    <User className="w-4 h-4 text-[#4BEA8A]" />
                    <span className="text-sm">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || user.lastName || '名前未設定'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側: プロフィール情報 */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-[#2A2A2A] border-[#444444] shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold text-[#FFFFFF]">
                    表示名
                    {isFromInvitation && !organizationProfile.displayName && (
                      <span className="text-red-400 ml-1">*必須</span>
                    )}
                  </Label>
                  {!isEditingDisplayName && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDisplayName(true)}
                      className="text-[#4BEA8A] hover:text-[#3DD879] hover:bg-[#333333]"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      編集
                    </Button>
                  )}
                </div>
                {isEditingDisplayName ? (
                  <div className="space-y-4">
                    <Input
                      value={editingDisplayName}
                      onChange={(e) => setEditingDisplayName(e.target.value)}
                      placeholder="表示名を入力"
                      className="w-full bg-[#333333] border-[#555555] text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                    />
                    <ActionButtons
                      onSave={handleSaveDisplayName}
                      onCancel={() => {
                        setIsEditingDisplayName(false);
                        setEditingDisplayName(organizationProfile.displayName || '');
                      }}
                      disabled={isSaving}
                    />
                  </div>
                ) : (
                  <div className="text-[#FFFFFF]">
                    {organizationProfile.displayName || '未設定'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#2A2A2A] border-[#444444] shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold text-[#FFFFFF]">
                    部署
                    {(isFromInvitation && !organizationProfile.organizationDepartmentId) && (
                      <span className="text-red-400 ml-1">*必須</span>
                    )}
                  </Label>
                  {!isEditingDepartment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDepartment(true)}
                      className="text-[#4BEA8A] hover:text-[#3DD879] hover:bg-[#333333]"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      編集
                    </Button>
                  )}
                </div>
                {isEditingDepartment ? (
                  <div className="space-y-4">
                    <DepartmentSelect
                      organizationId={params.organizationId as string}
                      organizationDepartmentId={editingOrganizationDepartmentId}
                      onChange={setEditingOrganizationDepartmentId}
                    />
                    <ActionButtons
                      onSave={handleSaveDepartment}
                      onCancel={() => {
                        setIsEditingDepartment(false);
                        setEditingOrganizationDepartmentId(
                          organizationProfile.organizationDepartmentId || ''
                        );
                      }}
                      disabled={isSaving}
                    />
                  </div>
                ) : (
                  <div className="text-[#FFFFFF]">
                    {organizationProfile.organizationDepartment?.name || '未設定'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#2A2A2A] border-[#444444] shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <Label htmlFor="introduction" className="font-semibold text-[#FFFFFF]">
                    自己紹介
                  </Label>
                  {!isEditingIntroduction && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingIntroduction(true)}
                      className="text-[#4BEA8A] hover:text-[#3DD879] hover:bg-[#333333]"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      編集
                    </Button>
                  )}
                </div>
                {isEditingIntroduction ? (
                  <>
                    <Textarea
                      id="introduction"
                      value={editingIntroduction}
                      onChange={(e) => setEditingIntroduction(e.target.value)}
                      placeholder="自己紹介を入力してください"
                      className="mt-2 bg-[#333333] border-[#555555] text-[#FFFFFF] placeholder-[#888888] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]"
                      rows={5}
                    />
                    <ActionButtons
                      onSave={handleSaveIntroduction}
                      onCancel={() => setIsEditingIntroduction(false)}
                      disabled={isSaving}
                    />
                  </>
                ) : (
                  <p className="text-[#CCCCCC] mt-2 whitespace-pre-wrap">
                    {organizationProfile.introduction || '未設定'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 招待フロー用の通知 */}
        <div>
          {isFromInvitation && !canProceed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 p-6 bg-gradient-to-br from-[#2A2A2A] to-[#1E1E1E] border-t-4 border-[#4BEA8A] rounded-lg text-center shadow-xl"
            >
              <AlertCircle className="w-10 h-10 text-[#4BEA8A] mx-auto mb-2" />
              <h3 className="text-base font-bold text-[#FFFFFF]">
                必須項目が完了していません
              </h3>
              <p className="text-[#CCCCCC] mt-2">
                表示名と部署を設定してください。
              </p>
            </motion.div>
          )}
          {isFromInvitation && canProceed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 p-6 bg-gradient-to-br from-[#2A2A2A] to-[#1E1E1E] border-t-4 border-[#4BEA8A] rounded-lg text-center shadow-xl"
            >
              <CheckCircle className="w-10 h-10 text-[#4BEA8A] mx-auto mb-2" />
              <h3 className="text-base font-bold text-[#FFFFFF]">すべての必須項目が登録されました</h3>
              <p className="text-[#CCCCCC] mt-2 mb-4">下のボタンから組織ページに進んでください。</p>
              <Button
                onClick={() => router.push(`/organization/${params.organizationId}`)}
                className="bg-[#4BEA8A] hover:bg-[#3DD879] text-[#1E1E1E] font-semibold"
              >
                組織ページへ
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function DepartmentSelect({
  organizationId,
  organizationDepartmentId,
  onChange,
}: {
  organizationId: string;
  organizationDepartmentId: string;
  onChange: (id: string) => void;
}) {
  const { departments, loading } = useDepartments(organizationId);

  if (loading) {
    return <div className="text-[#CCCCCC]">部署を読み込み中...</div>;
  }

  // departmentsが配列でない場合のエラーハンドリング
  if (!Array.isArray(departments)) {
    console.error('departments is not an array:', departments);
    return <div className="text-red-400">部署データの読み込みに失敗しました</div>;
  }

  return (
    <Select value={organizationDepartmentId} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-[#333333] border-[#555555] text-[#FFFFFF] focus:border-[#4BEA8A] focus:ring-[#4BEA8A]">
        <SelectValue placeholder="部署を選択" className="text-[#888888]" />
      </SelectTrigger>
      <SelectContent className="bg-[#333333] border-[#555555]">
        {departments.map((department) => (
          <SelectItem key={department.id} value={department.id} className="text-[#FFFFFF] hover:bg-[#444444]">
            {department.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 