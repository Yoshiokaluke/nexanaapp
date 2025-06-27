"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface RankingItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  rank: number;
}

interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  image: string;
  category: string;
  isNew?: boolean;
  isPopular?: boolean;
}

export default function OrganizationTopPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [organizationName, setOrganizationName] = useState('');
  const [isSystemTeam, setIsSystemTeam] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  // サンプルデータ
  const rankingItems: RankingItem[] = [
    {
      id: '1',
      name: 'シュマッツ ラガー',
      description: 'モルトの甘味とコクをじっくり堪能できるしっかりボディの長期熟成ラガー',
      price: '',
      image: '/lager-icon.svg',
      rank: 1
    },
    {
      id: '2',
      name: 'シュマッツ ヴァイツェン',
      description: '華やかな香りと芳醇な味わい。苦味が少なくフルーティーな白ビール',
      price: '',
      image: '/weizen-icon.svg',
      rank: 2
    },
    {
      id: '3',
      name: 'シュマッツ IPA',
      description: 'ホップの苦味と麦の甘みのバランスが抜群。何杯でも飲めるIPA',
      price: '',
      image: '/ipa-icon.svg',
      rank: 3
    },
    {
      id: '4',
      name: 'シュマッツ ヘレス',
      description: '苦味控えめ、驚きの美味しさ。100年以上人々に愛されてきた黄金色のヘレス',
      price: '',
      image: '/helles-icon.svg',
      rank: 4
    },
    {
      id: '5',
      name: 'ミックスセット',
      description: '人気のオリジナルビール3種を気軽にお試し。プレゼントにも最適な飲み比べセット',
      price: '',
      image: '/mix-icon.svg',
      rank: 5
    }
  ];

  const productItems: ProductItem[] = [
    {
      id: '1',
      name: 'シュマッツ ラガー',
      description: 'モルトの甘味とコクをじっくり堪能できるしっかりボディの長期熟成ラガー',
      price: '',
      image: '/lager-icon.svg',
      category: 'ラガー',
      isPopular: true
    },
    {
      id: '2',
      name: 'シュマッツ ヴァイツェン',
      description: '華やかな香りと芳醇な味わい。苦味が少なくフルーティーな白ビール',
      price: '',
      image: '/weizen-icon.svg',
      category: 'ヴァイツェン',
      isNew: true
    },
    {
      id: '3',
      name: 'シュマッツ IPA',
      description: 'ホップの苦味と麦の甘みのバランスが抜群。何杯でも飲めるIPA',
      price: '',
      image: '/ipa-icon.svg',
      category: 'IPA',
      isPopular: true
    },
    {
      id: '4',
      name: 'シュマッツ ヘレス',
      description: '苦味控えめ、驚きの美味しさ。100年以上人々に愛されてきた黄金色のヘレス',
      price: '',
      image: '/helles-icon.svg',
      category: 'ヘレス'
    },
    {
      id: '5',
      name: 'ミックスセット',
      description: '人気のオリジナルビール3種を気軽にお試し。プレゼントにも最適な飲み比べセット',
      price: '',
      image: '/mix-icon.svg',
      category: 'セット',
      isNew: true
    },
    {
      id: '6',
      name: '飲み比べセット',
      description: 'ヘレス3本とヴァイツェン3本の組み合わせで、それぞれの特徴を楽しめるセット',
      price: '',
      image: '/tasting-icon.svg',
      category: 'セット'
    }
  ];

  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      try {
        const userRes = await fetch('/api/users/me');
        const userData = await userRes.json();
        const systemRole = userData.user?.systemRole;
        setIsSystemTeam(systemRole === 'system_team');

        const orgRes = await fetch(`/api/organizations/${organizationId}`);
        const orgData = await orgRes.json();
        setOrganizationName(orgData.organization?.name || '');

        const membershipRes = await fetch(`/api/organizations/${organizationId}/members/me`);
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          const role = membershipData.role;
          setIsAdmin(role === 'admin' || systemRole === 'system_team');
          setIsMember(role === 'member' || role === 'admin' || systemRole === 'system_team');
        } else {
          setIsAdmin(systemRole === 'system_team');
          setIsMember(systemRole === 'system_team');
        }
      } catch {
        setOrganizationName('');
        setIsSystemTeam(false);
        setIsAdmin(false);
        setIsMember(false);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E1E1E]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4BEA8A] mx-auto mb-4"></div>
          <p className="text-[#4BEA8A]">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* ヒーローセクション */}
      <section className="relative w-full min-h-[40vh] flex items-center justify-center overflow-hidden border-b border-[#333]">
        <div className="relative z-20 text-center text-white py-16 w-full">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#4BEA8A] drop-shadow">{organizationName || '組織名'}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">この組織のメンバーやプロジェクトを管理・閲覧できます。</p>
        </div>
      </section>

      {/* 人気メンバーランキング */}
      <section className="py-16 lg:py-24 bg-[#1E1E1E] border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              人気メンバーランキング
            </h2>
            <p className="text-lg text-[#4BEA8A] max-w-2xl mx-auto">
              組織内で活躍している注目のメンバーをご紹介します
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rankingItems.map((item, index) => (
              <div key={item.id} className="relative group">
                <div className="bg-[#232323] rounded-2xl p-8 shadow-lg border border-[#4BEA8A] hover:shadow-xl hover:border-[#4BEA8A] transition-all duration-300">
                  {/* ランクバッジ */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#4BEA8A] text-[#1E1E1E] rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-2 border-[#1E1E1E]">
                    {item.rank}
                  </div>
                  {/* アイコン */}
                  <div className="w-20 h-20 rounded-full bg-[#1E1E1E] border-2 border-[#4BEA8A] flex items-center justify-center mb-6 mx-auto">
                    <Image src={item.image} alt={item.name} width={56} height={56} className="object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 text-center">{item.name}</h3>
                  <p className="text-white/80 mb-2 text-center">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* プロジェクト一覧セクション */}
      <section className="py-16 lg:py-24 bg-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              プロジェクト一覧
            </h2>
            <p className="text-lg text-[#4BEA8A] max-w-2xl mx-auto">
              組織で進行中のプロジェクトや活動をチェックしましょう
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productItems.map((item) => (
              <div key={item.id} className="group">
                <div className="bg-[#232323] rounded-2xl overflow-hidden shadow-lg border border-[#4BEA8A] hover:shadow-xl hover:border-[#4BEA8A] transition-all duration-300">
                  {/* プロジェクト画像エリア */}
                  <div className="relative h-48 lg:h-56 flex items-center justify-center bg-[#1E1E1E] border-b border-[#333]">
                    <Image src={item.image} alt={item.name} width={96} height={96} className="object-contain" />
                    {/* バッジ */}
                    {item.isNew && (
                      <div className="absolute top-4 left-4 bg-[#4BEA8A] text-[#1E1E1E] px-3 py-1 rounded-full text-sm font-bold">
                        NEW
                      </div>
                    )}
                    {item.isPopular && (
                      <div className="absolute top-4 right-4 bg-white text-[#1E1E1E] px-3 py-1 rounded-full text-sm font-bold border border-[#4BEA8A]">
                        注目
                      </div>
                    )}
                  </div>
                  {/* プロジェクト情報 */}
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[#4BEA8A] bg-[#1E1E1E] px-3 py-1 rounded-full border border-[#4BEA8A]">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#4BEA8A] transition-colors duration-300">
                      {item.name}
                    </h3>
                    <p className="text-white/80 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
