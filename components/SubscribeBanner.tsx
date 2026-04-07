import React, { useState } from 'react';
import { BellRing, BellOff, X } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface SubscribeBannerProps {
  user: User | null;
}

const SubscribeBanner: React.FC<SubscribeBannerProps> = ({ user }) => {
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isUnsubModalOpen, setIsUnsubModalOpen] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subName, setSubName] = useState('');
  const [subStatus, setSubStatus] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 관리자는 구독 버튼을 볼 필요가 없음
  if (user) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubStatus(null);
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'subscribers', subEmail), {
        name: subName,
        email: subEmail,
        subscribedAt: Date.now()
      });
      setSubStatus({ type: 'success', text: '구독 신청이 완료되었습니다!' });
      setTimeout(() => {
        setIsSubModalOpen(false);
        setSubEmail('');
        setSubName('');
        setSubStatus(null);
      }, 2000);
    } catch (error) {
      console.error(error);
      setSubStatus({ type: 'error', text: '오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubStatus(null);
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'subscribers', subEmail);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        if (docSnap.data().name === subName) {
          await deleteDoc(docRef);
          setSubStatus({ type: 'success', text: '구독이 취소되었습니다.' });
          setTimeout(() => {
            setIsUnsubModalOpen(false);
            setSubEmail('');
            setSubName('');
            setSubStatus(null);
          }, 2000);
        } else {
          setSubStatus({ type: 'error', text: '이름이 일치하지 않습니다.' });
        }
      } else {
        setSubStatus({ type: 'error', text: '구독 정보를 찾을 수 없습니다.' });
      }
    } catch (error) {
      console.error(error);
      setSubStatus({ type: 'error', text: '오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mb-6">
      <button 
        onClick={() => {
          setSubEmail('');
          setSubName('');
          setSubStatus(null);
          setIsSubModalOpen(true);
        }}
        className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border-2 border-blue-200 py-4 rounded-xl transition-colors shadow-sm group"
      >
        <BellRing size={20} className="group-hover:animate-bounce" />
        <span className="font-bold font-pixel text-lg">새 글 알림 구독</span>
      </button>

      {/* Subscribe Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative">
            <button 
              onClick={() => setIsSubModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <BellRing size={24} />
              </div>
              <h3 className="text-lg font-bold font-pixel text-gray-900">새 글 알림 구독</h3>
              <p className="text-xs text-gray-500 mt-2 font-sans break-keep">
                새로운 글이 올라오면 메일로 알려드립니다!
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 font-pixel">이메일 주소</label>
                <input
                  type="email"
                  required
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 font-pixel">이름 (꼭 실명으로 적어주세요!)</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans"
                  placeholder="홍길동"
                />
              </div>

              {subStatus && (
                <div className={`p-2 rounded text-xs font-pixel text-center ${subStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {subStatus.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-bold font-pixel py-2.5 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '처리 중...' : '구독 신청하기'}
              </button>
            </form>

            <div className="mt-4 text-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-600 font-sans">
                문의 사항은 <a href="mailto:0612cyh0612@gmail.com" className="text-blue-500 hover:underline font-bold">0612cyh0612@gmail.com</a>으로 문의해주세요.
              </p>
            </div>

            <div className="mt-4 text-center">
              <button 
                onClick={() => {
                  setIsSubModalOpen(false);
                  setSubEmail('');
                  setSubName('');
                  setSubStatus(null);
                  setIsUnsubModalOpen(true);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline font-pixel"
              >
                구독을 취소하시려면 여기를 클릭하세요
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsubscribe Modal */}
      {isUnsubModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative">
            <button 
              onClick={() => setIsUnsubModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <BellOff size={24} />
              </div>
              <h3 className="text-lg font-bold font-pixel text-gray-900">구독 취소하기</h3>
              <p className="text-xs text-gray-500 mt-2 font-sans break-keep">
                신청하셨던 이메일과 이름을 정확히 입력해주세요.
              </p>
            </div>

            <form onSubmit={handleUnsubscribe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 font-pixel">이메일 주소</label>
                <input
                  type="email"
                  required
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 outline-none text-sm font-sans"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 font-pixel">이름</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 outline-none text-sm font-sans"
                  placeholder="홍길동"
                />
              </div>

              {subStatus && (
                <div className={`p-2 rounded text-xs font-pixel text-center ${subStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {subStatus.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-800 text-white font-bold font-pixel py-2.5 rounded hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '처리 중...' : '구독 취소하기'}
              </button>
            </form>

            <div className="mt-4 text-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-600 font-sans">
                문의 사항은 <a href="mailto:0612cyh0612@gmail.com" className="text-blue-500 hover:underline font-bold">0612cyh0612@gmail.com</a>으로 문의해주세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribeBanner;
