"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Mail, MapPin, Pencil, User, Users, Lock, Building2, AlertCircle, CheckCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateSelect } from "@/components/ui/date-select";
import { useUser, useClerk } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

interface ProfileViewProps {
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    profile: {
      id: string;
      clerkId: string;
      birthday: Date | null;
      gender: string | null;
      snsLinks: any;
      companyName: string | null;
      departmentName: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  };
  clerkId: string;
}

type SnsLinks = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
};

const SNS_PATTERNS = {
  facebook: /^https?:\/\/(www\.)?(facebook|fb)\.com\/.+/,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.+/,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/,
};

interface SnsLink {
  platform: 'facebook' | 'linkedin' | 'instagram';
  url: string;
  isEditing: boolean;
  editValue: string;
}

export function ProfileView({ user: initialUser, clerkId }: ProfileViewProps) {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(initialUser);
  const [snsLinks, setSnsLinks] = useState<SnsLink[]>([
    { platform: 'facebook', url: initialUser.profile?.snsLinks?.facebook || '', isEditing: false, editValue: initialUser.profile?.snsLinks?.facebook || '' },
    { platform: 'linkedin', url: initialUser.profile?.snsLinks?.linkedin || '', isEditing: false, editValue: initialUser.profile?.snsLinks?.linkedin || '' },
    { platform: 'instagram', url: initialUser.profile?.snsLinks?.instagram || '', isEditing: false, editValue: initialUser.profile?.snsLinks?.instagram || '' },
  ]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingFirstName, setEditingFirstName] = useState(initialUser.firstName || '');
  const [editingLastName, setEditingLastName] = useState(initialUser.lastName || '');
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [isEditingBirthday, setIsEditingBirthday] = useState(false);
  const [editingGender, setEditingGender] = useState(initialUser.profile?.gender || '');
  const [editingBirthday, setEditingBirthday] = useState<Date | undefined>(
    initialUser.profile?.birthday ? new Date(initialUser.profile.birthday) : undefined
  );

  // 新しいフィールドの編集状態
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [editingCompany, setEditingCompany] = useState(initialUser.profile?.companyName || '');
  const [editingDepartment, setEditingDepartment] = useState(initialUser.profile?.departmentName || '');

  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingSnsLinks, setEditingSnsLinks] = useState<any>(initialUser.profile?.snsLinks || { facebook: '', linkedin: '', instagram: '' });
  const [editingSnsPlatform, setEditingSnsPlatform] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 招待フローからの誘導かどうかをチェック
  const isFromInvitation = searchParams.get('from_invitation') === 'true';
  const organizationId = searchParams.get('organization_id');

  useEffect(() => {
    // Google認証ユーザーの場合は、パスワード変更セクションを非表示にする
    const checkAuthProvider = async () => {
      if (clerkUser) {
        const externalAccounts = await clerkUser.externalAccounts;
        // 外部認証アカウントがない場合（メール/パスワード認証のみ）はパスワード変更を表示
        setIsPasswordChangeVisible(externalAccounts.length === 0);
      }
    };
    checkAuthProvider();
  }, [clerkUser]);

  // 必須項目の完了状況をチェック
  const checkRequiredFields = () => {
    const missingFields = [];
    if (!user.profile?.birthday) missingFields.push('birthday');
    if (!user.profile?.gender) missingFields.push('gender');
    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "未設定";
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGenderLabel = (gender: string | null | undefined) => {
    switch (gender) {
      case "male":
        return "男性";
      case "female":
        return "女性";
      case "other":
        return "その他";
      default:
        return "未設定";
    }
  };

  const validateUrl = (platform: keyof typeof SNS_PATTERNS, value: string) => {
    if (value && !SNS_PATTERNS[platform].test(value)) {
      toast.error("正しいURLを入力してください");
      return false;
    }
    return true;
  };

  const handleEdit = (platform: SnsLink['platform']) => {
    setSnsLinks(links => links.map(link => 
      link.platform === platform 
        ? { ...link, isEditing: true }
        : link
    ));
  };

  const handleCancel = (platform: SnsLink['platform']) => {
    setSnsLinks(links => links.map(link => 
      link.platform === platform 
        ? { ...link, isEditing: false, editValue: link.url }
        : link
    ));
  };

  const handleSave = async (platform: SnsLink['platform']) => {
    const link = snsLinks.find(l => l.platform === platform);
    if (!link) return;

    if (!validateUrl(platform, link.editValue)) return;

    try {
      const response = await fetch(`/api/users/${clerkId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snsLinks: {
            ...user.profile?.snsLinks,
            [platform]: link.editValue,
          },
        }),
      });

      if (!response.ok) throw new Error();

      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile!,
          snsLinks: {
            ...prev.profile!.snsLinks,
            [platform]: link.editValue,
          },
        },
      }));

      setSnsLinks(links => links.map(l => 
        l.platform === platform 
          ? { ...l, url: l.editValue, isEditing: false }
          : l
      ));

      toast.success("SNSリンクを更新しました");
    } catch {
      toast.error("更新に失敗しました");
    }
  };

  const handleChange = (platform: SnsLink['platform'], value: string) => {
    setSnsLinks(links => links.map(link => 
      link.platform === platform 
        ? { ...link, editValue: value }
        : link
    ));
  };

  const getSnsIcon = (platform: SnsLink['platform']) => {
    switch (platform) {
      case 'facebook':
        return <FacebookIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />;
      case 'linkedin':
        return <LinkedinIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />;
      case 'instagram':
        return <InstagramIcon className="w-6 h-6 md:w-8 md:h-8 text-pink-500" />;
    }
  };

  const handleSaveName = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${clerkId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: editingFirstName,
          lastName: editingLastName,
        }),
      });

      if (!response.ok) throw new Error();

      setUser(prev => ({
        ...prev,
        firstName: editingFirstName,
        lastName: editingLastName,
      }));

      setIsEditingName(false);
      toast.success("名前を更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGender = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${clerkId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gender: editingGender,
        }),
      });

      if (!response.ok) throw new Error();

      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile!,
          gender: editingGender,
        },
      }));

      setIsEditingGender(false);
      toast.success("性別を更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBirthday = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${clerkId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          birthday: editingBirthday,
        }),
      });

      if (!response.ok) throw new Error();

      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile!,
          birthday: editingBirthday ?? null,
        },
      }));

      setIsEditingBirthday(false);
      toast.success("生年月日を更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${clerkId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: editingCompany,
        }),
      });

      if (!response.ok) throw new Error();

      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile!,
          companyName: editingCompany,
        },
      }));

      setIsEditingCompany(false);
      toast.success("所属企業を更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDepartment = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${clerkId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          departmentName: editingDepartment,
        }),
      });

      if (!response.ok) throw new Error();

      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile!,
          departmentName: editingDepartment,
        },
      }));

      setIsEditingDepartment(false);
      toast.success("所属部署を更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("新しいパスワードが一致しません");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await fetch("/account/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) throw new Error();

      toast.success("パスワードを変更しました");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("パスワードの変更に失敗しました");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const startEditProfile = () => {
    setIsEditingProfile(true);
    setEditingSnsLinks(user.profile?.snsLinks || { facebook: '', linkedin: '', instagram: '' });
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${clerkId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snsLinks: editingSnsLinks,
        }),
      });

      if (!response.ok) throw new Error();

      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile!,
          snsLinks: editingSnsLinks,
        },
      }));

      setIsEditingProfile(false);
      toast.success("プロフィールを更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSns = async (platform: string) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${clerkId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snsLinks: {
            ...user.profile?.snsLinks,
            [platform]: editingSnsLinks[platform],
          },
        }),
      });

      if (!response.ok) throw new Error();

      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile!,
          snsLinks: {
            ...prev.profile!.snsLinks,
            [platform]: editingSnsLinks[platform],
          },
        },
      }));

      setEditingSnsPlatform(null);
      toast.success(`${platform}リンクを保存しました`);
    } catch (e) {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      toast.error("ログアウトに失敗しました");
    }
  };

  // 必須項目の完了状況
  const requiredFieldsStatus = checkRequiredFields();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 md:px-8 bg-gray-50 min-h-screen">
      {/* タイトル */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-3">
          <User className="w-7 h-7 text-blue-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">プロフィール・設定</h1>
        </div>
        <div className="h-1 w-16 bg-blue-100 rounded mt-2 mb-2" />
      </div>

      {/* 招待フローからの誘導の場合のヘッダー */}
      {isFromInvitation && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900">共通プロフィールの登録が必要です</h2>
                <p className="text-blue-700 text-sm mt-1">
                  組織に参加するために、以下の必須項目を登録してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 必須項目完了状況の表示 */}
      {isFromInvitation && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">必須項目の登録状況</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {user.profile?.birthday ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={user.profile?.birthday ? "text-green-700" : "text-red-700"}>
                  生年月日: {user.profile?.birthday ? "登録済み" : "未登録"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {user.profile?.gender ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={user.profile?.gender ? "text-green-700" : "text-red-700"}>
                  性別: {user.profile?.gender ? "登録済み" : "未登録"}
                </span>
              </div>
            </div>
            {requiredFieldsStatus.isComplete && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">すべての必須項目が登録されました</span>
                </div>
                {organizationId && (
                  <div className="mt-3">
                    <Button
                      onClick={() => router.push(`/organization/${organizationId}/(member)/OrganizationProfile/${clerkId}/edit?from_invitation=true`)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      組織プロフィールの登録に進む
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* プロフィール情報カード */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* メールアドレス */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-12 items-center">
            <div className="flex-shrink-0 flex items-center justify-start w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 shadow">
              <Mail className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">メールアドレス</div>
              <div className="flex items-center justify-between">
                <span className="block text-sm md:text-base text-gray-800 break-all font-normal">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
        {/* 氏名 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-12 items-center">
            <div className="flex-shrink-0 flex items-center justify-start w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 shadow">
              <User className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">氏名</div>
              {isEditingName ? (
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <Input
                      value={editingFirstName}
                      onChange={(e) => setEditingFirstName(e.target.value)}
                      placeholder="姓"
                      className="w-32 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 h-11 text-base shadow-sm"
                    />
                    <Input
                      value={editingLastName}
                      onChange={(e) => setEditingLastName(e.target.value)}
                      placeholder="名"
                      className="w-32 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 h-11 text-base shadow-sm"
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={handleSaveName} disabled={isSaving} className="h-11 px-4">保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingName(false); setEditingFirstName(user.firstName || ''); setEditingLastName(user.lastName || ''); }} disabled={isSaving} className="h-11 px-4">キャンセル</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-base md:text-lg ${user.firstName && user.lastName ? 'text-gray-800' : 'text-red-600'}`}>
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "未設定"}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingName(true)} className="text-blue-600 h-11 px-4">編集</Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 性別 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-12 items-center">
            <div className="flex-shrink-0 flex items-center justify-start w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 shadow">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">性別</div>
              {isEditingGender ? (
                <div className="flex items-center gap-3">
                  <Select value={editingGender} onValueChange={setEditingGender}>
                    <SelectTrigger className="w-44 h-11 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 text-base shadow-sm">
                      <SelectValue placeholder="性別を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男性</SelectItem>
                      <SelectItem value="female">女性</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleSaveGender} disabled={isSaving} className="h-11 px-4">保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingGender(false); setEditingGender(user.profile?.gender || ''); }} disabled={isSaving} className="h-11 px-4">キャンセル</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-base md:text-lg ${user.profile?.gender ? 'text-gray-800' : 'text-red-600'}`}>{getGenderLabel(user.profile?.gender)}</span>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingGender(true)} className="text-blue-600 h-11 px-4">編集</Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 生年月日 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-12 items-center">
            <div className="flex-shrink-0 flex items-center justify-start w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 shadow">
              <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">生年月日</div>
              {isEditingBirthday ? (
                <div className="flex items-center gap-3">
                  <DateSelect value={editingBirthday} onChange={setEditingBirthday} />
                  <Button size="sm" variant="outline" onClick={handleSaveBirthday} disabled={isSaving} className="h-11 px-4">保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingBirthday(false); setEditingBirthday(user.profile?.birthday ? new Date(user.profile.birthday) : undefined); }} disabled={isSaving} className="h-11 px-4">キャンセル</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-base md:text-lg ${user.profile?.birthday ? 'text-gray-800' : 'text-red-600'}`}>{formatDate(user.profile?.birthday)}</span>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingBirthday(true)} className="text-blue-600 h-11 px-4">編集</Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 所属企業 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-12 items-center">
            <div className="flex-shrink-0 flex items-center justify-start w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 shadow">
              <Building2 className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">所属企業</div>
              {isEditingCompany ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={editingCompany}
                    onChange={(e) => setEditingCompany(e.target.value)}
                    placeholder="所属企業名"
                    className="w-full md:w-80 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 h-11 text-base shadow-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleSaveCompany} disabled={isSaving} className="h-11 px-4">保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingCompany(false); setEditingCompany(user.profile?.companyName || ''); }} disabled={isSaving} className="h-11 px-4">キャンセル</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="block text-sm md:text-base text-gray-800 break-all font-normal">{user.profile?.companyName || "未設定"}</span>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingCompany(true)} className="text-blue-600 h-11 px-4">編集</Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 所属部署 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-12 items-center">
            <div className="flex-shrink-0 flex items-center justify-start w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 shadow">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">所属部署</div>
              {isEditingDepartment ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={editingDepartment}
                    onChange={(e) => setEditingDepartment(e.target.value)}
                    placeholder="所属部署名"
                    className="w-full md:w-80 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 h-11 text-base shadow-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleSaveDepartment} disabled={isSaving} className="h-11 px-4">保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingDepartment(false); setEditingDepartment(user.profile?.departmentName || ''); }} disabled={isSaving} className="h-11 px-4">キャンセル</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="block text-sm md:text-base text-gray-800 break-all font-normal">{user.profile?.departmentName || "未設定"}</span>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingDepartment(true)} className="text-blue-600 h-11 px-4">編集</Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* SNSリンク */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-12 items-center">
            <div className="flex-shrink-0 flex items-center justify-start w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 shadow">
              <FacebookIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Facebookリンク</div>
              {editingSnsPlatform === 'facebook' ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={editingSnsLinks['facebook'] || ''}
                    onChange={e => setEditingSnsLinks((prev: any) => ({ ...prev, facebook: e.target.value }))}
                    placeholder="FacebookのURL"
                    className="w-full md:w-80 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 h-11 text-base shadow-sm"
                  />
                  <Button size="sm" variant="outline" onClick={() => handleSaveSns('facebook')} disabled={isSaving} className="h-11 px-4">保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingSnsPlatform(null); setEditingSnsLinks((prev: any) => ({ ...prev, facebook: user.profile?.snsLinks?.facebook || '' })); }} disabled={isSaving} className="h-11 px-4">キャンセル</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="block text-sm md:text-base text-gray-800 break-all font-normal">
                    {user.profile?.snsLinks?.facebook ? (
                      <a href={user.profile.snsLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {user.profile.snsLinks.facebook}
                      </a>
                    ) : (
                      <span className="text-gray-600">未設定</span>
                    )}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setEditingSnsPlatform('facebook')} className="text-blue-600 h-11 px-4">編集</Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-12 items-center">
            <div className="flex-shrink-0 flex items-center justify-start w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 shadow">
              <LinkedinIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Linkedinリンク</div>
              {editingSnsPlatform === 'linkedin' ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={editingSnsLinks['linkedin'] || ''}
                    onChange={e => setEditingSnsLinks((prev: any) => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="LinkedinのURL"
                    className="w-full md:w-80 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 h-11 text-base shadow-sm"
                  />
                  <Button size="sm" variant="outline" onClick={() => handleSaveSns('linkedin')} disabled={isSaving} className="h-11 px-4">保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingSnsPlatform(null); setEditingSnsLinks((prev: any) => ({ ...prev, linkedin: user.profile?.snsLinks?.linkedin || '' })); }} disabled={isSaving} className="h-11 px-4">キャンセル</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="block text-sm md:text-base text-gray-800 break-all font-normal">
                    {user.profile?.snsLinks?.linkedin ? (
                      <a href={user.profile.snsLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {user.profile.snsLinks.linkedin}
                      </a>
                    ) : (
                      <span className="text-gray-600">未設定</span>
                    )}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setEditingSnsPlatform('linkedin')} className="text-blue-600 h-11 px-4">編集</Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-12 items-center">
            <div className="flex-shrink-0 flex items-center justify-start w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 shadow">
              <InstagramIcon className="w-6 h-6 md:w-8 md:h-8 text-pink-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Instagramリンク</div>
              {editingSnsPlatform === 'instagram' ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={editingSnsLinks['instagram'] || ''}
                    onChange={e => setEditingSnsLinks((prev: any) => ({ ...prev, instagram: e.target.value }))}
                    placeholder="InstagramのURL"
                    className="w-full md:w-80 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 h-11 text-base shadow-sm"
                  />
                  <Button size="sm" variant="outline" onClick={() => handleSaveSns('instagram')} disabled={isSaving} className="h-11 px-4">保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingSnsPlatform(null); setEditingSnsLinks((prev: any) => ({ ...prev, instagram: user.profile?.snsLinks?.instagram || '' })); }} disabled={isSaving} className="h-11 px-4">キャンセル</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="block text-sm md:text-base text-pink-500 break-all font-normal">
                    {user.profile?.snsLinks?.instagram ? (
                      <a href={user.profile.snsLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {user.profile.snsLinks.instagram}
                      </a>
                    ) : (
                      <span className="text-gray-400">未設定</span>
                    )}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setEditingSnsPlatform('instagram')} className="text-blue-600 h-11 px-4">編集</Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* パスワード変更 */}
        {isPasswordChangeVisible && (
          <div className="bg-white rounded-xl shadow p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">パスワード変更</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  現在のパスワード
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11 text-base shadow-sm w-full md:w-96"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 text-base shadow-sm w-full md:w-96"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード（確認）
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 text-base shadow-sm w-full md:w-96"
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full md:w-96 h-11 text-base bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
              >
                {isChangingPassword ? "更新中..." : "パスワードを変更"}
              </Button>
            </div>
          </div>
        )}

        {/* ログアウトボタン */}
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <div className="flex items-center justify-center">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full md:w-96 h-12 text-base border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold rounded-xl shadow-sm"
            >
              <LogOut className="w-5 h-5 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 