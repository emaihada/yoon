import React, { useState } from 'react';
import DraggableWindow from './DraggableWindow';

interface Quest {
  id: string;
  title: string;
  desc: string;
  target: string;
  requiredCount: number;
  currentCount: number;
  rewardGold: number;
  rewardExp: number;
  status: 'available' | 'active' | 'completed' | 'rewarded';
}

interface QuestWindowProps {
  onClose: () => void;
  quests: Quest[];
  onAcceptQuest: (id: string) => void;
  onCompleteQuest: (id: string) => void;
}

const QuestWindow: React.FC<QuestWindowProps> = ({ onClose, quests, onAcceptQuest, onCompleteQuest }) => {
  const [tab, setTab] = useState<'available' | 'active'>('available');

  const availableQuests = quests.filter(q => q.status === 'available');
  const activeQuests = quests.filter(q => q.status === 'active' || q.status === 'completed');

  return (
    <DraggableWindow title="퀘스트" onClose={onClose}>
      <div className="w-64 sm:w-80 p-2 bg-[#1a1a1a] text-[#d4c4a8] font-['Galmuri9']">
        <div className="flex gap-2 mb-4 border-b-2 border-[#555] pb-2">
          <button 
            className={`px-2 py-1 ${tab === 'available' ? 'bg-[#333] text-white' : 'bg-[#111] text-gray-400'} border-2 border-[#555] hover:bg-[#444]`}
            onClick={() => setTab('available')}
          >가능한 퀘스트</button>
          <button 
            className={`px-2 py-1 ${tab === 'active' ? 'bg-[#333] text-white' : 'bg-[#111] text-gray-400'} border-2 border-[#555] hover:bg-[#444]`}
            onClick={() => setTab('active')}
          >진행중</button>
        </div>

        <div className="h-64 overflow-y-auto pr-2">
          {tab === 'available' ? (
            <div className="flex flex-col gap-2">
              {availableQuests.length === 0 ? (
                <div className="text-center text-gray-500 py-4">가능한 퀘스트가 없습니다.</div>
              ) : (
                availableQuests.map(q => (
                  <div key={q.id} className="p-2 bg-[#222] border border-[#444]">
                    <div className="font-bold text-yellow-400">{q.title}</div>
                    <div className="text-xs text-gray-300 my-1">{q.desc}</div>
                    <div className="text-[10px] text-gray-400 mb-2">보상: {q.rewardGold}G, {q.rewardExp}EXP</div>
                    <button 
                      className="w-full py-1 bg-[#3a5a2a] text-white border-2 border-[#4a6a3a] hover:bg-[#4a6a3a]"
                      onClick={() => onAcceptQuest(q.id)}
                    >
                      수락하기
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeQuests.length === 0 ? (
                <div className="text-center text-gray-500 py-4">진행중인 퀘스트가 없습니다.</div>
              ) : (
                activeQuests.map(q => (
                  <div key={q.id} className="p-2 bg-[#222] border border-[#444]">
                    <div className="font-bold text-yellow-400">{q.title}</div>
                    <div className="text-xs text-gray-300 my-1">{q.desc}</div>
                    <div className="text-sm mb-2">
                      진행도: {q.currentCount} / {q.requiredCount}
                    </div>
                    {q.status === 'completed' ? (
                      <button 
                        className="w-full py-1 bg-[#8b6508] text-white border-2 border-[#a07a10] hover:bg-[#a07a10]"
                        onClick={() => onCompleteQuest(q.id)}
                      >
                        보상 받기
                      </button>
                    ) : (
                      <div className="text-center text-xs text-gray-500 py-1">진행중...</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </DraggableWindow>
  );
};

export default QuestWindow;
