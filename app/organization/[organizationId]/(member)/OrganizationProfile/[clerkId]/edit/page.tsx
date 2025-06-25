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
    >
      保存
    </Button>
    <Button type="button" variant="outline" size="sm" onClick={onCancel}>
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
      // 権限チェック: 現在のユーザーと編集対象のユーザーが一致する場合のみ
      if (clerkUser?.id !== params.clerkId) {
        toast.error('自分のプロフィールのみ編集できます');
        router.push(`/organization/${params.organizationId}/OrganizationProfile/${params.clerkId}`);
        return;
      }

      // 組織メンバーシップの確認
      const accessResponse = await fetch(`/api/auth/check-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: params.organizationId,
          clerkId: params.clerkId,
        }),
      });

      if (!accessResponse.ok) {
        toast.error('アクセス権限がありません');
        router.push(`/organization/${params.organizationId}/OrganizationProfile`);
        return;
      }
      setHasAccess(true);

      // 組織情報の取得
      const orgResponse = await fetch(`/api/organizations/${params.organizationId}`);
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganizationName(orgData.name);
      }

      // 組織プロフィールの取得
      const profileResponse = await fetch(
        `/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile`
      );
      if (!profileResponse.ok)
        throw new Error('プロフィールの取得に失敗しました');
      const profileData = await profileResponse.json();
      setOrganizationProfile(profileData);

      // ユーザー情報の取得
      const userResponse = await fetch(
        `/api/users/${params.clerkId}/profile?organizationId=${params.organizationId}`
      );
      if (!userResponse.ok) throw new Error('ユーザー情報の取得に失敗しました');
      const userData = await userResponse.json();
      setUser(userData);

      // 編集用の状態を設定
      setEditingDisplayName(profileData.displayName || '');
      setEditingOrganizationDepartmentId(
        profileData.organizationDepartmentId || ''
      );
      setEditingIntroduction(profileData.introduction || '');
    } catch (error) {
      console.error('Error:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 必須項目の完了状況をチェック
  const checkRequiredFields = () => {
    const missingFields: string[] = [];
    if (!organizationProfile?.displayName) missingFields.push('displayName');
    // DBに保存されている部署ID、または現在編集中に選択された部署IDのいずれかがない場合
    if (!organizationProfile?.organizationDepartmentId && !editingOrganizationDepartmentId) {
      missingFields.push('department');
    }
    
    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  };

  // 必須項目が完了した時の処理
  const handleRequiredFieldsComplete = async () => {
    if (!isFromInvitation) return;

    // 招待を受け入れる
    const success = await acceptInvitation();
    if (success) {
      // 組織ページに遷移
      router.push(`/organization/${params.organizationId}`);
    }
  };

  const handleSaveDisplayName = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(
        `/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: editingDisplayName }),
        }
      );
      if (!response.ok) throw new Error('更新に失敗しました');
      const updatedProfile = await response.json();
      setOrganizationProfile(updatedProfile);
      setIsEditingDisplayName(false);
      toast.success('表示名を更新しました');
    } catch (error) {
      toast.error('更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDepartment = async () => {
    if (!editingOrganizationDepartmentId) {
      toast.error('部署を選択してください');
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch(
        `/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationDepartmentId: editingOrganizationDepartmentId,
          }),
        }
      );
      if (!response.ok) throw new Error('更新に失敗しました');
      const updatedProfile = await response.json();
      setOrganizationProfile(updatedProfile);
      setIsEditingDepartment(false);
      toast.success('部署を更新しました');
    } catch (error) {
      toast.error('更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIntroduction = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(
        `/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ introduction: editingIntroduction }),
        }
      );
      if (!response.ok) throw new Error('更新に失敗しました');
      const updatedProfile = await response.json();
      setOrganizationProfile(updatedProfile);
      setIsEditingIntroduction(false);
      toast.success('自己紹介を更新しました');
    } catch (error) {
      toast.error('更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ファイルサイズは5MB以下にしてください');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルのみアップロード可能です');
      return;
    }

    setPreviewImage(URL.createObjectURL(file));
    setIsEditingImage(true); // プレビュー表示のために編集モードを維持
  };

  const handleSaveImage = async () => {
    if (!previewImage) return;
    // Base64からFileオブジェクトに変換
    const res = await fetch(previewImage);
    const blob = await res.blob();
    const file = new File([blob], "profile-image.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const response = await fetch(
        `/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile/image`,
        {
          method: 'POST',
          body: formData,
        }
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const updatedProfile = await response.json();
      setOrganizationProfile(updatedProfile); // ここでStateを更新
      toast.success('画像を更新しました');
      handleCancelImage(); // プレビューと編集モードをリセット
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : '画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelImage = () => {
    setPreviewImage(null);
    setIsEditingImage(false);
  };

  const handleImageDelete = async () => {
    try {
      setIsUploading(true);
      const response = await fetch(
        `/api/organizations/${params.organizationId}/members/${params.clerkId}/organization-profile/image`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }
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
      <div className="p-4 md:p-8 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full bg-gray-200"></div>
              <div className="flex-1 w-full">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess || !organizationProfile || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            プロフィールが見つかりません
          </h2>
          <Button onClick={() => router.push(`/organization/${params.organizationId}/OrganizationProfile`)}>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          {organizationName}
        </h1>
        <p className="text-gray-500 mb-6">プロフィール設定</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar
                      key={organizationProfile.updatedAt}
                      className="w-32 h-32 mx-auto mb-4"
                    >
                      <AvatarImage src={imageUrl} alt="プロフィール画像" />
                      <AvatarFallback />
                    </Avatar>
                    <div className="mt-4 space-y-2">
                      {previewImage ? (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600 mb-2">
                            プレビュー
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveImage}
                              disabled={isUploading}
                              size="sm"
                              className="flex-1"
                            >
                              {isUploading ? '保存中...' : '保存'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleCancelImage}
                              disabled={isUploading}
                              size="sm"
                              className="flex-1"
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      ) : isEditingImage ? (
                        <div className="space-y-2">
                          <label className="cursor-pointer w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
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
                            className="w-full"
                          >
                            <X className="w-4 h-4 mr-2" />
                            画像を削除
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingImage(false)}
                            disabled={isUploading}
                            className="w-full"
                          >
                            キャンセル
                          </Button>
                        </div>
                      ) : organizationProfile.profileImage ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingImage(true)}
                          className="w-full"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          画像を編集
                        </Button>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
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
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || user.lastName || '名前未設定'}
                    </span>
                  </div>
                </div>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold">
                    表示名
                    {isFromInvitation && !organizationProfile.displayName && (
                      <span className="text-red-500 ml-1">*必須</span>
                    )}
                  </Label>
                  {!isEditingDisplayName && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDisplayName(true)}
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
                      className="w-full"
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
                  <div className="text-gray-700">
                    {organizationProfile.displayName || '未設定'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold">
                    部署
                    {(isFromInvitation && !organizationProfile.organizationDepartmentId) && (
                      <span className="text-red-500 ml-1">*必須</span>
                    )}
                  </Label>
                  {!isEditingDepartment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDepartment(true)}
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
                  <div className="text-gray-700">
                    {organizationProfile.organizationDepartment?.name || '未設定'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <Label htmlFor="introduction" className="font-semibold">
                    自己紹介
                  </Label>
                  {!isEditingIntroduction && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingIntroduction(true)}
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
                      className="mt-2"
                      rows={5}
                    />
                    <ActionButtons
                      onSave={handleSaveIntroduction}
                      onCancel={() => setIsEditingIntroduction(false)}
                      disabled={isSaving}
                    />
                  </>
                ) : (
                  <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                    {organizationProfile.introduction || '未設定'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          {isFromInvitation && !canProceed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-t-4 border-amber-400 rounded-lg text-center shadow-lg"
            >
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-800">
                必須項目が完了していません
              </h3>
            </motion.div>
          )}
          {isFromInvitation && canProceed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 p-6 bg-gradient-to-br from-green-50 to-teal-50 border-t-4 border-green-400 rounded-lg text-center shadow-lg"
            >
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-800">すべての必須項目が登録されました</h3>
              <p className="text-sm text-gray-700 mt-2 mb-4">下のボタンから組織ページに進んでください。</p>
              <Button
                onClick={() => router.push(`/organization/${params.organizationId}`)}
                className="bg-green-600 hover:bg-green-700 text-white"
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
    return <div className="text-gray-500">部署を読み込み中...</div>;
  }

  // departmentsが配列でない場合のエラーハンドリング
  if (!Array.isArray(departments)) {
    console.error('departments is not an array:', departments);
    return <div className="text-red-500">部署データの読み込みに失敗しました</div>;
  }

  return (
    <Select value={organizationDepartmentId} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="部署を選択" />
      </SelectTrigger>
      <SelectContent>
        {departments.map((department) => (
          <SelectItem key={department.id} value={department.id}>
            {department.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 