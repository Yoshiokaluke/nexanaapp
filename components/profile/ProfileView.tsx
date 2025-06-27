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
    <div className="max-w-6xl mx-auto py-12 px-4 md:px-8 relative">
      {/* タイトル */}
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-xl flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-[#1E1E1E]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#4BEA8A] to-white bg-clip-text text-transparent tracking-tight">
            マイプロフィール
          </h1>
        </div>
        <div className="w-32 h-1 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] mx-auto rounded-full shadow-lg"></div>
      </div>

      {/* 招待フローからの誘導の場合のヘッダー */}
      {isFromInvitation && (
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">共通プロフィールの登録が必要です</h2>
                  <p className="text-blue-200 text-sm">
                    組織に参加するために、以下の必須項目を登録してください。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 必須項目完了状況の表示 */}
      {isFromInvitation && (
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-gray-100/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-white/5 to-gray-100/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#1E1E1E]" />
                </div>
                必須項目の登録状況
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#333333]/50 to-[#2A2A2A]/50 rounded-xl border border-[#4BEA8A]/10">
                  {user.profile?.birthday ? (
                    <CheckCircle className="w-5 h-5 text-[#4BEA8A]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={user.profile?.birthday ? "text-[#4BEA8A] font-medium" : "text-red-400 font-medium"}>
                    生年月日: {user.profile?.birthday ? "登録済み" : "未登録"}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#333333]/50 to-[#2A2A2A]/50 rounded-xl border border-[#4BEA8A]/10">
                  {user.profile?.gender ? (
                    <CheckCircle className="w-5 h-5 text-[#4BEA8A]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={user.profile?.gender ? "text-[#4BEA8A] font-medium" : "text-red-400 font-medium"}>
                    性別: {user.profile?.gender ? "登録済み" : "未登録"}
                  </span>
                </div>
              </div>
              {requiredFieldsStatus.isComplete && (
                <div className="mt-6 p-4 bg-gradient-to-r from-[#4BEA8A]/10 to-[#3DD879]/10 border border-[#4BEA8A]/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-[#4BEA8A]" />
                    <span className="text-[#4BEA8A] font-bold text-lg">すべての必須項目が登録されました</span>
                  </div>
                  {organizationId && (
                    <Button
                      onClick={() => router.push(`/organization/${organizationId}/(member)/OrganizationProfile/${clerkId}/edit?from_invitation=true`)}
                      className="bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                    >
                      組織プロフィールの登録に進む
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* プロフィール情報カード */}
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* メールアドレスカード */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                  <Mail className="w-8 h-8 text-[#1E1E1E]" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">メールアドレス</div>
                <div className="text-xl text-white font-semibold break-all">{user.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 氏名 */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {isEditingName ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">氏名</div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-[#4BEA8A] mb-2">姓</label>
                        <Input
                          value={editingFirstName}
                          onChange={(e) => setEditingFirstName(e.target.value)}
                          className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#4BEA8A] mb-2">名</label>
                        <Input
                          value={editingLastName}
                          onChange={(e) => setEditingLastName(e.target.value)}
                          className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-4 py-2 border border-[#4BEA8A] text-[#4BEA8A] rounded-xl font-semibold hover:bg-[#4BEA8A] hover:text-[#1E1E1E] transition-all duration-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveName}
                    className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">氏名</div>
                    <div className="text-xl text-white font-semibold break-all">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "未設定"}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingName(true)} 
                  className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 性別 */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {isEditingGender ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">性別</div>
                    <Select value={editingGender} onValueChange={setEditingGender}>
                      <SelectTrigger className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl">
                        <SelectValue placeholder="性別を選択" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-[#333333] text-white">
                        <SelectItem value="male">男性</SelectItem>
                        <SelectItem value="female">女性</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditingGender(false)}
                    className="px-4 py-2 border border-[#4BEA8A] text-[#4BEA8A] rounded-xl font-semibold hover:bg-[#4BEA8A] hover:text-[#1E1E1E] transition-all duration-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveGender}
                    className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">性別</div>
                    <div className="text-xl text-white font-semibold break-all">{getGenderLabel(user.profile?.gender)}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingGender(true)} 
                  className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 生年月日 */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {isEditingBirthday ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <CalendarIcon className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">生年月日</div>
                    <DateSelect
                      value={editingBirthday}
                      onChange={setEditingBirthday}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditingBirthday(false)}
                    className="px-4 py-2 border border-[#4BEA8A] text-[#4BEA8A] rounded-xl font-semibold hover:bg-[#4BEA8A] hover:text-[#1E1E1E] transition-all duration-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveBirthday}
                    className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <CalendarIcon className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">生年月日</div>
                    <div className="text-xl text-white font-semibold break-all">{formatDate(user.profile?.birthday)}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingBirthday(true)} 
                  className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 所属企業 */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {isEditingCompany ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <Building2 className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">所属企業</div>
                    <Input
                      value={editingCompany}
                      onChange={(e) => setEditingCompany(e.target.value)}
                      className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditingCompany(false)}
                    className="px-4 py-2 border border-[#4BEA8A] text-[#4BEA8A] rounded-xl font-semibold hover:bg-[#4BEA8A] hover:text-[#1E1E1E] transition-all duration-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveCompany}
                    className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <Building2 className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">所属企業</div>
                    <div className="text-xl text-white font-semibold break-all">{user.profile?.companyName || "未設定"}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingCompany(true)} 
                  className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 所属部署 */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {isEditingDepartment ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">所属部署</div>
                    <Input
                      value={editingDepartment}
                      onChange={(e) => setEditingDepartment(e.target.value)}
                      className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditingDepartment(false)}
                    className="px-4 py-2 border border-[#4BEA8A] text-[#4BEA8A] rounded-xl font-semibold hover:bg-[#4BEA8A] hover:text-[#1E1E1E] transition-all duration-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveDepartment}
                    className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">所属部署</div>
                    <div className="text-xl text-white font-semibold break-all">{user.profile?.departmentName || "未設定"}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingDepartment(true)} 
                  className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SNSリンク */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {editingSnsPlatform === 'facebook' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <FacebookIcon className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">Facebookリンク</div>
                    <Input
                      value={editingSnsLinks.facebook || ''}
                      onChange={(e) => setEditingSnsLinks({...editingSnsLinks, facebook: e.target.value})}
                      placeholder="https://facebook.com/your-profile"
                      className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setEditingSnsPlatform(null)}
                    className="px-4 py-2 border border-[#4BEA8A] text-[#4BEA8A] rounded-xl font-semibold hover:bg-[#4BEA8A] hover:text-[#1E1E1E] transition-all duration-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleSaveSns('facebook')}
                    className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <FacebookIcon className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">Facebookリンク</div>
                    <div className="text-xl text-white font-semibold break-all">
                      {user.profile?.snsLinks?.facebook ? (
                        <a href={user.profile.snsLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#4BEA8A]">
                          {user.profile.snsLinks.facebook}
                        </a>
                      ) : (
                        <span className="text-gray-400">未設定</span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingSnsPlatform('facebook')} 
                  className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {editingSnsPlatform === 'linkedin' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <LinkedinIcon className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">LinkedInリンク</div>
                    <Input
                      value={editingSnsLinks.linkedin || ''}
                      onChange={(e) => setEditingSnsLinks({...editingSnsLinks, linkedin: e.target.value})}
                      placeholder="https://linkedin.com/in/your-profile"
                      className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setEditingSnsPlatform(null)}
                    className="px-4 py-2 border border-[#4BEA8A] text-[#4BEA8A] rounded-xl font-semibold hover:bg-[#4BEA8A] hover:text-[#1E1E1E] transition-all duration-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleSaveSns('linkedin')}
                    className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <LinkedinIcon className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">LinkedInリンク</div>
                    <div className="text-xl text-white font-semibold break-all">
                      {user.profile?.snsLinks?.linkedin ? (
                        <a href={user.profile.snsLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#4BEA8A]">
                          {user.profile.snsLinks.linkedin}
                        </a>
                      ) : (
                        <span className="text-gray-400">未設定</span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingSnsPlatform('linkedin')} 
                  className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {editingSnsPlatform === 'instagram' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <InstagramIcon className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">Instagramリンク</div>
                    <Input
                      value={editingSnsLinks.instagram || ''}
                      onChange={(e) => setEditingSnsLinks({...editingSnsLinks, instagram: e.target.value})}
                      placeholder="https://instagram.com/your-profile"
                      className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setEditingSnsPlatform(null)}
                    className="px-4 py-2 border border-[#4BEA8A] text-[#4BEA8A] rounded-xl font-semibold hover:bg-[#4BEA8A] hover:text-[#1E1E1E] transition-all duration-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleSaveSns('instagram')}
                    className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                      <InstagramIcon className="w-8 h-8 text-[#1E1E1E]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">Instagramリンク</div>
                    <div className="text-xl text-white font-semibold break-all">
                      {user.profile?.snsLinks?.instagram ? (
                        <a href={user.profile.snsLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#4BEA8A]">
                          {user.profile.snsLinks.instagram}
                        </a>
                      ) : (
                        <span className="text-gray-400">未設定</span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingSnsPlatform('instagram')} 
                  className="px-4 py-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] rounded-xl font-semibold hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        {/* パスワード変更 */}
        {isPasswordChangeVisible && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border border-[#333333] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full blur opacity-30 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-full flex items-center justify-center shadow-lg">
                    <Lock className="w-8 h-8 text-[#1E1E1E]" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#4BEA8A] uppercase tracking-wide mb-2">パスワード変更</div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#4BEA8A] mb-2">
                        現在のパスワード
                      </label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4BEA8A] mb-2">
                        新しいパスワード
                      </label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4BEA8A] mb-2">
                        新しいパスワード（確認）
                      </label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 text-base bg-[#1E1E1E] border-[#333333] text-white focus:border-[#4BEA8A] focus:ring-[#4BEA8A]/20 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="px-6 py-3 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] hover:from-[#3DD879] hover:to-[#4BEA8A] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold rounded-xl"
                >
                  {isChangingPassword ? "更新中..." : "パスワードを変更"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ログアウトボタン */}
        <div className="flex justify-center pt-8">
          <button
            onClick={handleLogout}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg rounded-xl flex items-center gap-3"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
} 