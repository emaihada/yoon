import React, { useState } from 'react';
import Layout from '../components/Layout';
import FortuneCookie from '../components/FortuneCookie';
import { User } from 'firebase/auth';

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

const FortunePage: React.FC<PageProps> = ({ user }) => {
  const [omikuji, setOmikuji] = useState<OmikujiResult | null>(null);
  const [isShaking, setIsShaking] = useState(false);

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
    <Layout title="오늘의 운세">
      
      {/* Disclaimer Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-4 text-center shadow-sm">
        <p className="text-red-600 font-bold font-pixel text-xs md:text-sm animate-pulse">
          ※ 첫 번째로 나온 운세만 진짜 운세로 쳐줌 ※
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Section 1: Omikuji (Divination) */}
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center relative flex flex-col items-center justify-center min-h-[200px]">
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
        <div className="min-h-[200px]">
          <FortuneCookie />
        </div>

      </div>
    </Layout>
  );
};

export default FortunePage;