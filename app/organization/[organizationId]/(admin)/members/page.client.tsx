'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

interface Member {
  id: string;
  clerkId: string;
  role: 'admin' | 'member';
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    systemRole: string | null;
  };
}

interface InvitationUrl {
  id: string;
  role: 'admin' | 'member';
  token: string;
  expiresAt: string;
  createdAt: string;
  inviter: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export default function MembersClient({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitationUrls, setInvitationUrls] = useState<InvitationUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'invitation-urls'>('members');
  
  // 招待URL生成用の状態
  const [showCreateUrlDialog, setShowCreateUrlDialog] = useState(false);
  const [newUrlRole, setNewUrlRole] = useState<'admin' | 'member'>('member');
  const [creatingUrl, setCreatingUrl] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [showDeleteUrlDialog, setShowDeleteUrlDialog] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState<InvitationUrl | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for organization:', organizationId);
        
        const [membersResponse, urlsResponse] = await Promise.all([
          fetch(`/api/organizations/${organizationId}/members`),
          fetch(`/api/organizations/${organizationId}/invitation-url`)
        ]);

        console.log('Members response status:', membersResponse.status);
        console.log('URLs response status:', urlsResponse.status);

        if (!membersResponse.ok) {
          throw new Error('メンバー一覧の取得に失敗しました');
        }
        if (!urlsResponse.ok) {
          throw new Error('招待URL一覧の取得に失敗しました');
        }

        const [membersData, urlsData] = await Promise.all([
          membersResponse.json(),
          urlsResponse.json()
        ]);

        console.log('Members data:', membersData);
        console.log('URLs data:', urlsData);

        setMembers(membersData);
        setInvitationUrls(urlsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error instanceof Error ? error.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  const handleInvite = () => {
    router.push(`/organization/${organizationId}/members/invite`);
  };

  const handleRoleChange = async (clerkId: string, newRole: 'admin' | 'member') => {
    setUpdatingMember(clerkId);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${clerkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '役割の変更に失敗しました');
      }

      const updatedMember = await response.json();
      setMembers(prev => prev.map(member => 
        member.clerkId === clerkId ? { ...member, ...updatedMember } : member
      ));
      toast.success('役割を変更しました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '役割の変更に失敗しました');
    } finally {
      setUpdatingMember(null);
    }
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;

    setDeletingMember(memberToDelete.clerkId);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberToDelete.clerkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'メンバーの削除に失敗しました');
      }

      setMembers(prev => prev.filter(member => member.clerkId !== memberToDelete.clerkId));
      toast.success('メンバーを削除しました');
      setShowDeleteDialog(false);
      setMemberToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'メンバーの削除に失敗しました');
    } finally {
      setDeletingMember(null);
    }
  };

  const handleCreateUrl = async () => {
    setCreatingUrl(true);
    try {
      console.log('Creating invitation URL with:', { role: newUrlRole });
      
      const response = await fetch(`/api/organizations/${organizationId}/invitation-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: newUrlRole
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || '招待URLの生成に失敗しました');
      }

      const result = await response.json();
      console.log('Generated invitation URL result:', result);
      
      // 新しい招待URLを一覧に追加
      setInvitationUrls(prev => {
        console.log('Previous URLs:', prev);
        const newUrls = [result.invitation, ...prev];
        console.log('New URLs:', newUrls);
        return newUrls;
      });
      
      // 招待URLをクリップボードにコピー
      await navigator.clipboard.writeText(result.inviteUrl);
      
      toast.success('招待URLを生成しました。クリップボードにコピーされました。');
      setShowCreateUrlDialog(false);
      setNewUrlRole('member');
    } catch (error) {
      console.error('Error creating invitation URL:', error);
      toast.error(error instanceof Error ? error.message : '招待URLの生成に失敗しました');
    } finally {
      setCreatingUrl(false);
    }
  };

  const handleDeleteUrlClick = (url: InvitationUrl) => {
    setUrlToDelete(url);
    setShowDeleteUrlDialog(true);
  };

  const handleDeleteUrlConfirm = async () => {
    if (!urlToDelete) return;

    setDeletingUrl(urlToDelete.id);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/invitation-url/${urlToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '招待URLの削除に失敗しました');
      }

      setInvitationUrls(prev => prev.filter(url => url.id !== urlToDelete.id));
      toast.success('招待URLを削除しました');
      setShowDeleteUrlDialog(false);
      setUrlToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '招待URLの削除に失敗しました');
    } finally {
      setDeletingUrl(null);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('招待URLをクリップボードにコピーしました');
    } catch (error) {
      toast.error('クリップボードへのコピーに失敗しました');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">メンバー管理</h1>
        <div className="flex gap-2">
          {activeTab === 'members' && (
            <Button onClick={handleInvite}>メンバーを招待</Button>
          )}
          {activeTab === 'invitation-urls' && (
            <Button onClick={() => setShowCreateUrlDialog(true)}>招待URLを生成</Button>
          )}
        </div>
      </div>

      {/* タブ */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'members'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('members')}
        >
          メンバー一覧 ({members.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'invitation-urls'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('invitation-urls')}
        >
          招待URL ({invitationUrls.length})
        </button>
      </div>

      {/* メンバー一覧タブ */}
      {activeTab === 'members' && (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {member.user.firstName} {member.user.lastName}
                    {member.user.systemRole && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        システムチーム
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{member.user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value: 'admin' | 'member') => handleRoleChange(member.clerkId, value)}
                    disabled={updatingMember === member.clerkId}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">メンバー</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick(member)}
                    disabled={deletingMember === member.clerkId}
                  >
                    {deletingMember === member.clerkId ? '削除中...' : '削除'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 招待URL一覧タブ */}
      {activeTab === 'invitation-urls' && (
        <div className="grid gap-4">
          {invitationUrls.map((url) => {
            const inviteUrl = `${window.location.origin}/organization/${organizationId}/invitation/${url.id}/accept?token=${url.token}`;
            const isExpired = new Date(url.expiresAt) < new Date();
            
            return (
              <Card key={url.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {url.role === 'admin' ? '管理者' : 'メンバー'}招待URL
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">一時的</span>
                      {isExpired && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">期限切れ</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      作成者: {url.inviter?.firstName || 'Unknown'} {url.inviter?.lastName || ''}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      作成日: {new Date(url.createdAt).toLocaleString('ja-JP')}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      有効期限: {new Date(url.expiresAt).toLocaleString('ja-JP')} (7日間)
                    </div>
                    <div className="text-xs text-blue-600 mb-2">
                      ※ このURLは7日間有効で、複数の人が使用できます
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-sm font-mono break-all">
                      {inviteUrl}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => copyToClipboard(inviteUrl)}
                      disabled={isExpired}
                    >
                      コピー
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteUrlClick(url)}
                      disabled={deletingUrl === url.id}
                    >
                      {deletingUrl === url.id ? '削除中...' : '削除'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {invitationUrls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              招待URLがありません。新しい招待URLを生成してください。
            </div>
          )}
        </div>
      )}

      {/* メンバー削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーの削除</DialogTitle>
            <DialogDescription>
              {memberToDelete && (
                <>
                  <strong>{memberToDelete.user.firstName} {memberToDelete.user.lastName}</strong>
                  ({memberToDelete.user.email}) を組織から削除しますか？
                </>
              )}
              <br />
              この操作は取り消すことができません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => {
                setShowDeleteDialog(false);
                setMemberToDelete(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingMember === memberToDelete?.clerkId}
            >
              {deletingMember === memberToDelete?.clerkId ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 招待URL生成ダイアログ */}
      <Dialog open={showCreateUrlDialog} onOpenChange={setShowCreateUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>一時的な招待URLを生成</DialogTitle>
            <DialogDescription>
              新しい一時的な招待URLを生成します。このURLは7日間有効で、複数の人が使用できます。
              期限が切れると自動的に削除されます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">ロール</Label>
              <Select value={newUrlRole} onValueChange={(value: 'admin' | 'member') => setNewUrlRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">メンバー</SelectItem>
                  <SelectItem value="admin">管理者</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-500">
              有効期限: 7日間（生成日から7日間有効です）
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => setShowCreateUrlDialog(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCreateUrl}
              disabled={creatingUrl}
            >
              {creatingUrl ? '生成中...' : '生成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 招待URL削除確認ダイアログ */}
      <Dialog open={showDeleteUrlDialog} onOpenChange={setShowDeleteUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>招待URLの削除</DialogTitle>
            <DialogDescription>
              この招待URLを削除しますか？
              <br />
              削除された招待URLは使用できなくなります。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => {
                setShowDeleteUrlDialog(false);
                setUrlToDelete(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUrlConfirm}
              disabled={deletingUrl === urlToDelete?.id}
            >
              {deletingUrl === urlToDelete?.id ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 