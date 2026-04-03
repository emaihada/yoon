import React, { useState } from 'react';
import Layout from '../components/Layout';
import { UserProfile, ContentItem } from '../types';
import { Instagram, Mail, X, Eye } from 'lucide-react';
import { User } from 'firebase/auth';
import FortuneCookie from '../components/FortuneCookie';
import ContentList from '../components/ContentList';
import { incrementPostViews } from '../services/firebase';

interface PageProps {
  user: User | null;
}

type FortuneLevel = '大吉' | '中吉' | '小吉' | '吉' | '末吉' | '凶' | '大凶';

interface OmikujiResult {
  level: FortuneLevel;
  title: string;
  description: string;
  color: string;
}

const OMIKUJI_DATA: OmikujiResult[] = [
  { level: '大吉', title: '대길 (大吉)', description: '더할 나위 없이 좋은 최고의 운수', color: 'text-red-600' },
  { level: '中吉', title: '중길 (中吉)', description: '꽤 괜찮은 행운', color: 'text-orange-500' },
  { level: '小吉', title: '소길 (小吉)', description: '소소하지만 기분 좋은 행운', color: 'text-blue-500' },
  { level: '吉', title: '길 (吉)', description: '평범하게 좋은 운수', color: 'text-green-600' },
  { level: '末吉', title: '말길 (末吉)', description: '끝에 가서 좋아지거나, 겨우 길한 정도', color: 'text-gray-500' },
  { level: '凶', title: '흉 (凶)', description: '운이 좋지 않음', color: 'text-gray-700' },
  { level: '大凶', title: '대흉 (大凶)', description: '매우 좋지 않은 운수', color: 'text-black' },
];

const Home: React.FC<PageProps> = ({ user }) => {
  const [omikuji, setOmikuji] = useState<OmikujiResult | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ContentItem | null>(null);

  const handlePostClick = (item: ContentItem) => {
    setSelectedPost(item);
    incrementPostViews(item.id);
  };

  const closeLightbox = () => {
    setSelectedPost(null);
  };

  // Static profile data for this demo
  const profile: UserProfile = {
    name: "Choi Yoon Ha",
    birthday: "2007.06.12",
    zodiac: "쌍둥이자리",
    chineseZodiac: "돼지띠",
    bloodType: "A형",
    mbti: "ISFP",
    motto: "꿈은 크게 가져라, 그래야 포기할 때 덜 아깝다.",
    instagram: "@c.y.h_0612",
    email: "chcii1234@naver.com"
  };

  const drawOmikuji = () => {
    setIsShaking(true);
    setOmikuji(null);
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * OMIKUJI_DATA.length);
      setOmikuji(OMIKUJI_DATA[randomIndex]);
      setIsShaking(false);
    }, 1000); // 1 second shaking animation
  };

  return (
    <Layout title="메인">
      <div className="h-full flex flex-col gap-8 items-center justify-start pb-8">
        
        {/* Profile Card (Centered & Expanded) */}
        <div className="w-full max-w-md mt-4">
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm text-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-6 overflow-hidden border-4 border-dashed border-cy-orange p-1">
              <img src="https://i.postimg.cc/0Nqz1gbM/1.jpg" alt="Profile" className="w-full h-full object-cover rounded-full" />
            </div>
            <h2 className="text-2xl font-bold font-pixel mb-2">{profile.name}</h2>
            <p className="text-lg font-hand text-gray-600 mb-1">최윤하 (崔允河)</p>
            <p className="text-sm text-gray-500 mb-6 mt-2 break-keep leading-snug px-4 italic">
              "{profile.motto}"
            </p>
            
            <div className="text-left text-sm space-y-2 bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 mx-auto max-w-xs">
              <p className="flex items-center gap-3"><span className="w-5 text-center text-lg">🎂</span> {profile.birthday}</p>
              <p className="flex items-center gap-3"><span className="w-5 text-center text-lg">♊</span> {profile.zodiac}</p>
              <p className="flex items-center gap-3"><span className="w-5 text-center text-lg">🐷</span> {profile.chineseZodiac}</p>
              <p className="flex items-center gap-3"><span className="w-5 text-center text-lg">🩸</span> {profile.bloodType}</p>
              <p className="flex items-center gap-3"><span className="w-5 text-center text-lg">🧠</span> {profile.mbti}</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-2 text-pink-600 hover:text-pink-500 transition-colors bg-pink-50 px-4 py-2 rounded-full w-fit">
                <Instagram size={18} /> 
                <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="font-pixel text-sm hover:underline">
                  {profile.instagram}
                </a>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full w-fit">
                <Mail size={18} /> 
                <span className="font-pixel text-sm">
                  {profile.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fortune Section */}
        <div className="w-full">
          <h3 className="text-lg font-bold font-pixel mb-4 text-cy-dark border-b pb-2">오늘의 운세</h3>
          
          {/* Disclaimer Banner */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-4 text-center shadow-sm">
            <p className="text-red-600 font-bold font-pixel text-xs md:text-sm animate-pulse">
              ※ 첫 번째로 나온 운세만 진짜 운세로 쳐줌 ※
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {/* Section 1: Omikuji (Divination) */}
            <div className="bg-purple-50 p-2 md:p-4 rounded-xl border border-purple-100 text-center relative flex flex-col items-center justify-center min-h-[150px] md:min-h-[200px]">
              <div className="text-3xl mb-2">🔮</div>
              <h3 className="text-base font-bold text-purple-900 mb-3 font-pixel">오늘의 점괘</h3>
              
              {!omikuji && !isShaking && (
                <button 
                  onClick={drawOmikuji}
                  className="bg-purple-600 text-white px-5 py-2 rounded shadow-lg hover:bg-purple-700 transition-colors clickable font-bold text-xs transform hover:scale-105 font-pixel"
                >
                  점괘 뽑기
                </button>
              )}

              {isShaking && (
                 <div className="text-2xl animate-bounce my-2 font-pixel">🎲 흔드는 중...</div>
              )}

              {omikuji && !isShaking && (
                <div className="animate-fade-in w-full bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
                   <h4 className={`text-xl font-bold font-pixel mb-1 ${omikuji.color}`}>
                     {omikuji.title}
                   </h4>
                   <p className="text-gray-600 font-medium break-keep font-pixel text-xs">
                     {omikuji.description}
                   </p>
                   <button 
                    onClick={() => setOmikuji(null)}
                    className="mt-3 text-[10px] text-gray-400 hover:text-gray-600 underline clickable font-pixel"
                  >
                    다시 뽑기 (재미로만!)
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Fortune Cookie */}
            <div className="min-h-[150px] md:min-h-[200px]">
              <FortuneCookie />
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="w-full mt-4">
          <h3 className="text-lg font-bold font-pixel mb-4 text-cy-dark border-b pb-2">사진첩</h3>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 md:p-4 min-h-[300px]">
            <ContentList 
              category="gallery" 
              isAdmin={!!user}
              inputMode="gallery"
              displayMode="gallery"
              onItemClick={handlePostClick}
            />
          </div>
        </div>

        {/* Custom Lightbox / Detail Modal */}
        {selectedPost && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-fade-in p-4">
            <button 
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/70 hover:text-white clickable"
            >
              <X size={32} />
            </button>

            <div className="text-white text-center mb-4 space-y-1">
               {selectedPost.title && (
                 <h2 className="text-xl font-bold font-pixel tracking-wide">{selectedPost.title}</h2>
               )}
               <div className="flex items-center justify-center gap-3 text-xs text-gray-400 font-pixel">
                  <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                  {user && (
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      <span>{selectedPost.views ? selectedPost.views + 1 : 1}</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="relative max-w-full max-h-[80vh] overflow-hidden rounded shadow-2xl border-4 border-white">
               {selectedPost.imageUrl && (
                 <img 
                   src={selectedPost.imageUrl} 
                   alt={selectedPost.title || "Gallery Image"} 
                   className="max-w-full max-h-[75vh] object-contain"
                 />
               )}
            </div>
          </div>
        )}
        
      </div>
    </Layout>
  );
};

export default Home;