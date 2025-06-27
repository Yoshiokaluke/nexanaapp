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
      image: '/a.icon.svg',
      rank: 1
    },
    {
      id: '2',
      name: 'シュマッツ ヴァイツェン',
      description: '華やかな香りと芳醇な味わい。苦味が少なくフルーティーな白ビール',
      price: '',
      image: '/a.icon.svg',
      rank: 2
    },
    {
      id: '3',
      name: 'シュマッツ IPA',
      description: 'ホップの苦味と麦の甘みのバランスが抜群。何杯でも飲めるIPA',
      price: '',
      image: '/a.icon.svg',
      rank: 3
    },
    {
      id: '4',
      name: 'シュマッツ ヘレス',
      description: '苦味控えめ、驚きの美味しさ。100年以上人々に愛されてきた黄金色のヘレス',
      price: '',
      image: '/a.icon.svg',
      rank: 4
    },
    {
      id: '5',
      name: 'ミックスセット',
      description: '人気のオリジナルビール3種を気軽にお試し。プレゼントにも最適な飲み比べセット',
      price: '',
      image: '/a.icon.svg',
      rank: 5
    }
  ];

  const productItems: ProductItem[] = [
    {
      id: '1',
      name: 'シュマッツ ラガー',
      description: 'モルトの甘味とコクをじっくり堪能できるしっかりボディの長期熟成ラガー',
      price: '',
      image: '/b.icon.svg',
      category: 'ラガー',
      isPopular: true
    },
    {
      id: '2',
      name: 'シュマッツ ヴァイツェン',
      description: '華やかな香りと芳醇な味わい。苦味が少なくフルーティーな白ビール',
      price: '',
      image: '/b.icon.svg',
      category: 'ヴァイツェン',
      isNew: true
    },
    {
      id: '3',
      name: 'シュマッツ IPA',
      description: 'ホップの苦味と麦の甘みのバランスが抜群。何杯でも飲めるIPA',
      price: '',
      image: '/b.icon.svg',
      category: 'IPA',
      isPopular: true
    },
    {
      id: '4',
      name: 'シュマッツ ヘレス',
      description: '苦味控えめ、驚きの美味しさ。100年以上人々に愛されてきた黄金色のヘレス',
      price: '',
      image: '/b.icon.svg',
      category: 'ヘレス'
    },
    {
      id: '5',
      name: 'ミックスセット',
      description: '人気のオリジナルビール3種を気軽にお試し。プレゼントにも最適な飲み比べセット',
      price: '',
      image: '/b.icon.svg',
      category: 'セット',
      isNew: true
    },
    {
      id: '6',
      name: '飲み比べセット',
      description: 'ヘレス3本とヴァイツェン3本の組み合わせで、それぞれの特徴を楽しめるセット',
      price: '',
      image: '/b.icon.svg',
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
          <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 border-b-2 border-[#4BEA8A] mx-auto mb-3 lg:mb-4"></div>
          <p className="text-[#4BEA8A] text-sm lg:text-base">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* ヘッダーはlayout.tsxなどで共通化されている想定 */}
      <section className="w-full relative">
        <Image
          src="/hero.pc.svg" // public配下の画像を利用
          alt="組織イメージ"
          width={1920}
          height={400}
          className="w-full h-40 sm:h-56 md:h-72 object-cover"
          priority
        />
        {/* 必要なら画像上にテキストを重ねる場合はabsoluteで配置 */}
      </section>
      {/* ここから既存のコンテンツ */}
      <main className="px-4 py-6">
        {/* タイトルや説明文など */}
      </main>

      {/* 人気メンバーランキング */}
      <section className="py-8 lg:py-16 xl:py-24 bg-[#1E1E1E] border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-16">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 lg:mb-4">
              人気クラフトビール缶ランキング
            </h2>
            <p className="text-sm lg:text-lg text-[#4BEA8A] max-w-2xl mx-auto px-4">
              話題のクラフトビール缶をランキング形式でご紹介します
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
            {rankingItems.map((item, index) => (
              <div key={item.id} className="relative group">
                <div className="bg-[#232323] rounded-xl lg:rounded-2xl p-4 lg:p-8 shadow-lg border border-[#4BEA8A] hover:shadow-xl hover:border-[#4BEA8A] transition-all duration-300">
                  {/* ランクバッジ */}
                  <div className="absolute -top-2 -left-2 lg:-top-4 lg:-left-4 w-8 h-8 lg:w-12 lg:h-12 bg-[#4BEA8A] text-[#1E1E1E] rounded-full flex items-center justify-center font-bold text-sm lg:text-lg shadow-lg border-2 border-[#1E1E1E]">
                    {item.rank}
                  </div>
                  {/* アイコン */}
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[#1E1E1E] border-2 border-[#4BEA8A] flex items-center justify-center mb-4 lg:mb-6 mx-auto">
                    <Image src={item.image} alt={item.name} width={40} height={40} className="w-10 h-10 lg:w-14 lg:h-14 object-contain" />
                  </div>
                  <h3 className="text-lg lg:text-2xl font-bold text-white mb-1 lg:mb-2 text-center">{item.name}</h3>
                  <p className="text-white/80 mb-2 text-center text-xs lg:text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* プロジェクト一覧セクション */}
      <section className="py-8 lg:py-16 xl:py-24 bg-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-16">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 lg:mb-4">
              クラフトビール缶 メニューリスト
            </h2>
            <p className="text-sm lg:text-lg text-[#4BEA8A] max-w-2xl mx-auto px-4">
              取り扱い中のクラフトビール缶メニューをご覧いただけます
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
            {productItems.map((item) => (
              <div key={item.id} className="group">
                <div className="bg-[#232323] rounded-xl lg:rounded-2xl overflow-hidden shadow-lg border border-[#4BEA8A] hover:shadow-xl hover:border-[#4BEA8A] transition-all duration-300">
                  {/* プロジェクト画像エリア */}
                  <div className="relative aspect-[16/9] w-full bg-[#1E1E1E] border-b border-[#333] rounded-t-xl overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded-t-xl"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    {/* バッジ */}
                    {item.isNew && (
                      <div className="absolute top-2 left-2 lg:top-4 lg:left-4 bg-[#4BEA8A] text-[#1E1E1E] px-2 py-1 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm font-bold">
                        NEW
                      </div>
                    )}
                    {item.isPopular && (
                      <div className="absolute top-2 right-2 lg:top-4 lg:right-4 bg-white text-[#1E1E1E] px-2 py-1 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm font-bold border border-[#4BEA8A]">
                        注目
                      </div>
                    )}
                  </div>
                  {/* プロジェクト情報 */}
                  <div className="p-4 lg:p-8">
                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                      <span className="text-xs lg:text-sm font-medium text-[#4BEA8A] bg-[#1E1E1E] px-2 py-1 lg:px-3 lg:py-1 rounded-full border border-[#4BEA8A]">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-lg lg:text-2xl font-bold text-white mb-1 lg:mb-2 group-hover:text-[#4BEA8A] transition-colors duration-300">
                      {item.name}
                    </h3>
                    <p className="text-white/80 leading-relaxed text-xs lg:text-sm">
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
