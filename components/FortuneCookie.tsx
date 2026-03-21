import React, { useState } from 'react';

const FORTUNES = [
  "오늘은 정말 운이 좋은 날이에요!",
  "코너를 돌면 뜻밖의 행운이 기다리고 있어요.",
  "웃으세요, 세상이 당신과 함께 웃을 거예요.",
  "기다리는 자에게 복이 온답니다.",
  "당신의 창의력이 빛을 발하는 날입니다.",
  "곧 흥미로운 사람을 만나게 될 거예요.",
  "걱정 마세요, 다 잘 될 거예요.",
  "자신을 믿으세요.",
  // Bad/Mixed fortunes
  "오늘은 발밑을 조심하는 게 좋겠어요.",
  "예상치 못한 지출이 생길 수 있으니 주의하세요.",
  "가만히 있으면 중간이라도 갑니다.",
  "오늘은 집에서 푹 쉬는 게 최고의 선택일지도 몰라요.",
  "다이어트는 내일부터... 오늘은 그냥 드세요.",
  "지나친 기대는 실망을 부를 수 있어요.",
  "오해가 생길 수 있으니 말을 아끼세요.",
];

const FortuneCookie: React.FC = () => {
  const [fortune, setFortune] = useState<string | null>(null);

  const crackCookie = () => {
    const random = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    setFortune(random);
  };

  return (
    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center relative h-full flex flex-col items-center justify-center">
      <div className="text-3xl mb-2">🥠</div>
      <h3 className="text-base font-bold text-orange-800 mb-3 font-pixel">포춘쿠키</h3>
      
      {!fortune ? (
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={crackCookie}
            className="bg-cy-orange text-white px-5 py-2 rounded shadow-sm hover:bg-orange-600 transition-colors clickable font-bold text-xs"
          >
            쿠키 열기
          </button>
        </div>
      ) : (
        <div className="animate-fade-in w-full">
          <div className="bg-white p-3 rounded border border-orange-200 shadow-sm mb-2 min-h-[60px] flex items-center justify-center">
            <p className="text-gray-700 font-bold break-keep text-sm">"{fortune}"</p>
          </div>
          <button 
            onClick={() => setFortune(null)}
            className="text-[10px] text-gray-400 hover:text-gray-600 underline clickable"
          >
            다시 하기
          </button>
        </div>
      )}
    </div>
  );
};

export default FortuneCookie;