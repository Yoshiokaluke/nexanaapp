"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const dynamic = 'force-dynamic';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヒーローページ */}
      <section className="relative w-full min-h-[60vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/ladies.svg"
          alt="ヒーロー画像"
          fill
          className="object-cover object-center z-0"
          priority
        />
        <div className="relative z-20 text-center text-white">
          {/* 必要ならここにテキストやボタン */}
        </div>
      </section>

      {/* ランキングセクション */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              人気商品ランキング
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              缶のクラフトビールをたくさん取り揃えています。その中でも特に人気の商品をご紹介します
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {rankingItems.map((item, index) => (
              <div key={item.id} className="relative group">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                  {/* ランクバッジ */}
                  <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {item.rank}
                  </div>
                  
                  {/* アイコン */}
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 lg:w-10 lg:h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 商品一覧セクション */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              商品一覧
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              魅力的なクラフトビールをたくさん取り揃えています
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {productItems.map((item) => (
              <div key={item.id} className="group">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* 商品画像エリア */}
                  <div className="relative h-48 lg:h-56 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 lg:w-12 lg:h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    
                    {/* バッジ */}
                    {item.isNew && (
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        NEW
                      </div>
                    )}
                    {item.isPopular && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        人気
                      </div>
                    )}
                  </div>
                  
                  {/* 商品情報 */}
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors duration-300">
                      {item.name}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed">
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
