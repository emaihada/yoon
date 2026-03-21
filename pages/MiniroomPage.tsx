import React, { useState } from 'react';
import Layout from '../components/Layout';
import Miniroom from '../components/Miniroom';
import { User } from 'firebase/auth';
import { Plus, RotateCcw, Palette } from 'lucide-react';

interface PageProps {
  user: User | null;
}

const MiniroomPage: React.FC<PageProps> = ({ user }) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingBg, setIsEditingBg] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const titleNode = (
    <div className="flex items-center justify-between w-full pr-2">
      <span>미니룸</span>
      {user && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-full hover:bg-gray-100 transition-colors shadow-sm font-pixel"
          >
            <RotateCcw size={14} />
            <span className="text-xs hidden md:inline">전체 삭제</span>
          </button>
          <button
            onClick={() => setIsEditingBg(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-full hover:bg-gray-100 transition-colors shadow-sm font-pixel"
          >
            <Palette size={14} />
            <span className="text-xs hidden md:inline">배경 설정</span>
          </button>
          <button
            onClick={() => setIsAddingItem(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-cy-orange text-white text-sm rounded-full hover:bg-orange-600 transition-colors shadow-sm font-pixel"
          >
            <Plus size={14} />
            <span className="text-xs hidden md:inline">아이템 추가</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Layout title={titleNode}>
      <div className="w-full h-[calc(100vh-180px)] min-h-[500px] bg-white rounded-lg shadow-inner border border-gray-200 overflow-hidden relative">
        <Miniroom 
          isEditable={!!user} 
          isAddingItem={isAddingItem}
          onCloseAdding={() => setIsAddingItem(false)}
          isEditingBg={isEditingBg}
          onCloseBg={() => setIsEditingBg(false)}
          resetTrigger={resetTrigger}
        />
        {showConfirm && (
          <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-scale-in text-center">
              <h3 className="font-pixel text-lg mb-2 text-cy-dark">전체 삭제</h3>
              <p className="text-sm text-gray-600 mb-6 break-keep">모든 아이템을 정말 삭제하시겠습니까?</p>
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => setShowConfirm(false)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-pixel hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={() => { setResetTrigger(prev => prev + 1); setShowConfirm(false); }} 
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-pixel hover:bg-red-600 transition-colors"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MiniroomPage;
