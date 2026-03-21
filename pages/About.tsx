import React from 'react';
import Layout from '../components/Layout';
import { User } from 'firebase/auth';

interface PageProps {
  user: User | null;
}

const About: React.FC<PageProps> = ({ user }) => {
  return (
    <Layout title="프로필">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        
        {/* Left Column: User Manual */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm h-full">
            <h3 className="text-xl font-bold text-cy-dark font-pixel mb-6 text-center border-b-2 border-dashed border-gray-100 pb-3">
              사용 설명서
            </h3>
            
            <div className="mb-8">
              <h4 className="font-bold text-cy-orange mb-3 flex items-center gap-2">
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Do's</span>
                내가 좋아하는 것
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 pl-2">
                <li className="flex items-center gap-2">
                  <span className="text-cy-orange text-[10px] leading-none pt-0.5">❤</span> 
                  <span>아주 웃긴 것</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cy-orange text-[10px] leading-none pt-0.5">❤</span> 
                  <span>몸 편하고 마음 편한 것</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cy-orange text-[10px] leading-none pt-0.5">❤</span> 
                  <span>내 방 침대</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cy-orange text-[10px] leading-none pt-0.5">❤</span> 
                  <span>맛난 것</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cy-orange text-[10px] leading-none pt-0.5">❤</span> 
                  <span>혼자만의 시간</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-blue-500 mb-3 flex items-center gap-2">
                 <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Don'ts</span>
                 내가 싫어하는 것
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 pl-2">
                 <li className="flex items-center gap-2">
                  <span className="text-gray-400 text-[10px] leading-none pt-0.5">✖</span> 
                  <span>싸가지가바가지</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400 text-[10px] leading-none pt-0.5">✖</span> 
                  <span>꺼드럭대기</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400 text-[10px] leading-none pt-0.5">✖</span> 
                  <span>사람들이 한 바가지</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400 text-[10px] leading-none pt-0.5">✖</span> 
                  <span>소음 천국</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400 text-[10px] leading-none pt-0.5">✖</span> 
                  <span>내로남불</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Words & Wishlist */}
        <div className="space-y-6 flex flex-col">
           {/* Frequent Words */}
           <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold font-pixel mb-4 text-cy-dark">💬 좋아하는 단어</h3>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm border border-gray-200 shadow-sm">왕</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm border border-gray-200 shadow-sm">고구마</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm border border-gray-200 shadow-sm">키보드</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm border border-gray-200 shadow-sm">개</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm border border-gray-200 shadow-sm">병따개</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm border border-gray-200 shadow-sm">퀸</span>
              </div>
           </div>

           {/* Wishlist */}
           <div className="bg-yellow-50/50 border border-yellow-100 p-5 rounded-xl shadow-sm flex-1">
              <h3 className="text-lg font-bold font-pixel mb-4 text-yellow-800 flex items-center gap-2">
                ✨ 가지고 싶은 것
              </h3>
               <ul className="space-y-3 text-sm text-gray-800">
                 <li className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-yellow-50">
                   <span className="text-xl">💰</span> 
                   <span>아무 문제 없는 100억</span>
                 </li>
                 <li className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-yellow-50">
                   <span className="text-xl">⏳</span> 
                   <span>타임머신</span>
                 </li>
                 <li className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-yellow-50">
                   <span className="text-xl">🍗</span> 
                   <span>먹어도 살찌지 않는 맛난 음식</span>
                 </li>
                 <li className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-yellow-50">
                   <span className="text-xl">🤴</span> 
                   <span>초고교급 미남</span>
                 </li>
               </ul>
           </div>
        </div>

      </div>
    </Layout>
  );
};

export default About;