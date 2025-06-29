'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, MapPin, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    managerName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/system-team/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        router.push('/system-team/organizations');
      } else {
        const error = await response.json();
        console.error('組織の作成に失敗しました:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#1A1A1A] to-[#0F0F0F] relative overflow-hidden">
      {/* 背景の装飾要素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4BEA8A]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#3DD879]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4BEA8A]/3 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-8 max-w-2xl">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Link 
              href="/system-team/organizations"
              className="flex items-center text-[#4BEA8A] hover:text-[#3DD879] transition-colors duration-200 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              戻る
            </Link>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-[#4BEA8A] to-white bg-clip-text text-transparent mb-3">
            新規組織作成
          </h1>
          <div className="w-16 lg:w-24 h-1 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] mx-auto rounded-full"></div>
        </div>

        {/* フォーム */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4BEA8A]/20 to-[#3DD879]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          
          <Card className="relative bg-gradient-to-br from-[#2A2A2A]/80 to-[#1E1E1E]/80 border-[#333333] shadow-2xl backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-[#4BEA8A] text-xl lg:text-2xl">
                <div className="w-10 h-10 bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#1E1E1E]" />
                </div>
                組織情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#4BEA8A] font-semibold text-sm uppercase tracking-wide">
                    組織名
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-[#4BEA8A]/60" />
                    </div>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="pl-10 bg-[#232323] border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                      placeholder="組織名を入力してください"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[#4BEA8A] font-semibold text-sm uppercase tracking-wide">
                    住所
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-[#4BEA8A]/60" />
                    </div>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="pl-10 bg-[#232323] border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                      placeholder="住所を入力してください（任意）"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerName" className="text-[#4BEA8A] font-semibold text-sm uppercase tracking-wide">
                    管理者名
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-[#4BEA8A]/60" />
                    </div>
                    <Input
                      id="managerName"
                      type="text"
                      value={formData.managerName}
                      onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                      className="pl-10 bg-[#232323] border-[#4BEA8A]/30 text-[#FFFFFF] placeholder-[#CCCCCC] focus:border-[#4BEA8A] focus:ring-[#4BEA8A] transition-all duration-200"
                      placeholder="管理者名を入力してください（任意）"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#4BEA8A] to-[#3DD879] text-[#1E1E1E] hover:from-[#3DD879] hover:to-[#4BEA8A] font-semibold py-3 text-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E1E1E] mr-2"></div>
                        作成中...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Building2 className="w-5 h-5 mr-2" />
                        組織を作成
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 