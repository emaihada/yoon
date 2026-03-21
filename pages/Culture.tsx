import React from 'react';
import Layout from '../components/Layout';
import { User } from 'firebase/auth';

interface PageProps {
  user: User | null;
}

interface CultureItem {
  id: string;
  title: string;
  image: string;
  year: string;
  info1: string; // Comment (Movie/Anime) or Genre (Music)
  info2: string; // Director (Movie) or Artist (Music) or Protagonist (Anime)
}

const movies: CultureItem[] = [
  {
    id: 'm1',
    title: '줄무늬 파자마를 입은 소년',
    image: 'https://i.postimg.cc/T34NQ6Yf/1.webp',
    year: '2008',
    info1: '순수함과 참혹함의 대비',
    info2: '마크 허먼'
  },
  {
    id: 'm2',
    title: '천공의 성 라퓨타',
    image: 'https://i.postimg.cc/hvL0BFBz/3.webp',
    year: '1986',
    info1: '개인적 지브리 원탑',
    info2: '미야자키 하야오'
  },
  {
    id: 'm3',
    title: '해피 투게더',
    image: 'https://i.postimg.cc/yxmTHqHS/2.webp',
    year: '1997',
    info1: '이별의 아픔과 영상미',
    info2: '왕가위'
  }
];

const music: CultureItem[] = [
  {
    id: 's1',
    title: 'Power',
    image: 'https://i.postimg.cc/tJ3zj0j1/5.jpg',
    year: '1996',
    info1: 'Power Metal',
    info2: 'Helloween'
  },
  {
    id: 's2',
    title: "California Dreamin'",
    image: 'https://i.postimg.cc/VvqF8y8C/7.png',
    year: '1965',
    info1: 'Folk Rock',
    info2: 'The Mamas & the Papas'
  },
  {
    id: 's3',
    title: 'Silent Jealousy',
    image: 'https://i.postimg.cc/vTrvsRs7/6.jpg',
    year: '1991',
    info1: 'Visual Rock',
    info2: 'X Japan'
  }
];

const anime: CultureItem[] = [
  {
    id: 'a1',
    title: '나루토',
    image: 'https://i.postimg.cc/zvCkrmrT/9.webp',
    year: '2002',
    info1: '이거 보여주려고 어그로 끌었다',
    info2: '우즈마키 나루토'
  },
  {
    id: 'a2',
    title: '드래곤볼',
    image: 'https://i.postimg.cc/90dBh3hT/8.webp',
    year: '1986',
    info1: '소년만화의 정점',
    info2: '손오공'
  },
  {
    id: 'a3',
    title: '이니셜 D',
    image: 'https://i.postimg.cc/NF6xchc6/10.webp',
    year: '1998',
    info1: '질주본능은 누구에게나 있다',
    info2: '후지와라 타쿠미'
  }
];

const CultureCard: React.FC<{ item: CultureItem, type: 'movie' | 'music' | 'anime' }> = ({ item, type }) => {
  return (
    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center text-center h-full overflow-hidden">
      {/* Image Container */}
      <div className={`w-full bg-gray-50 rounded mb-2 overflow-hidden relative shadow-inner ${type === 'music' ? 'aspect-square' : 'aspect-[2/3]'}`}>
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
        />
        <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
          {item.year}
        </div>
      </div>
      
      {/* Title Container: Fixed Height & break-keep for word-level wrapping */}
      <div className="w-full h-14 flex items-center justify-center mb-1 px-1">
        <h4 className="font-bold text-sm md:text-base leading-tight break-keep text-center">
          {item.title}
        </h4>
      </div>
      
      {/* Info Section: Increased Height (h-14) for multi-line safety, break-keep, customized order */}
      <div className="w-full h-14 flex flex-col justify-start items-center text-[10px] md:text-xs text-gray-500 space-y-1 break-keep">
        {type === 'anime' ? (
          <>
            {/* Anime: Swap Order (Protagonist first) */}
            {item.info2 && <p className="text-gray-400">{item.info2}</p>}
            <p className="text-cy-orange font-bold">{item.info1}</p>
          </>
        ) : (
          <>
            {/* Others: Standard Order (Comment/Genre first) */}
            <p className={type === 'music' ? 'text-blue-500 font-medium' : ''}>
              {item.info1}
            </p>
            {item.info2 && <p className="text-gray-400">{item.info2}</p>}
          </>
        )}
      </div>
    </div>
  );
};

const Culture: React.FC<PageProps> = ({ user }) => {
  return (
    <Layout title="문화 생활">
      <div className="space-y-10 pb-10">
        
        {/* Movies */}
        <section>
          <h3 className="text-lg font-bold text-cy-dark mb-4 border-l-4 border-cy-orange pl-3 font-pixel">
            🎬 인생 영화
          </h3>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {movies.map(item => <CultureCard key={item.id} item={item} type="movie" />)}
          </div>
        </section>

        {/* Music */}
        <section>
          <h3 className="text-lg font-bold text-cy-dark mb-4 border-l-4 border-blue-400 pl-3 font-pixel">
            🎧 좋아하는 음악
          </h3>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {music.map(item => <CultureCard key={item.id} item={item} type="music" />)}
          </div>
        </section>

        {/* Anime */}
        <section>
          <h3 className="text-lg font-bold text-cy-dark mb-4 border-l-4 border-pink-400 pl-3 font-pixel">
            📺 추천 애니
          </h3>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {anime.map(item => <CultureCard key={item.id} item={item} type="anime" />)}
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default Culture;