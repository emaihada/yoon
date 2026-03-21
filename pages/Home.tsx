import React from 'react';
import Layout from '../components/Layout';
import { UserProfile } from '../types';
import { Instagram, Mail } from 'lucide-react';
import { User } from 'firebase/auth';

interface PageProps {
  user: User | null;
}

const Home: React.FC<PageProps> = ({ user }) => {
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

  return (
    <Layout title="메인">
      <div className="h-full flex items-center justify-center">
        
        {/* Profile Card (Centered & Expanded) */}
        <div className="w-full max-w-md">
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
        
      </div>
    </Layout>
  );
};

export default Home;