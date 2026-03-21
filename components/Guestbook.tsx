import React, { useEffect, useState } from 'react';
import { addGuestbookEntry, deleteGuestbookEntry, subscribeToGuestbook } from '../services/firebase';
import { GuestbookEntry } from '../types';
import { Send, Trash2, Smile } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface GuestbookProps {
  isAdmin: boolean;
  showTitle?: boolean;
}

const Guestbook: React.FC<GuestbookProps> = ({ isAdmin, showTitle = true }) => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGuestbook((data) => {
      setEntries(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    
    await addGuestbookEntry(name, content);
    setName('');
    setContent('');
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteGuestbookEntry(deleteId);
      setDeleteId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const handleSmileClick = () => {
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
    }, 2000);
  };

  return (
    <div className="mt-4 md:mt-8 h-full flex flex-col">
      <ConfirmModal 
        isOpen={!!deleteId}
        title="방명록 삭제"
        message="정말 이 방명록을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="삭제"
      />

      {showTitle ? (
        <h3 className="text-xl font-bold font-pixel text-cy-dark mb-4 border-b border-dashed border-gray-300 pb-2 flex items-end gap-2 overflow-hidden">
          <span className="shrink-0">방명록</span>
          <span className="text-[10px] md:text-xs font-normal text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
            ※삭제는 최윤하에게 요청하지 않으면 불가능. 신중히 쓸 것!※
          </span>
        </h3>
      ) : (
        <div className="mb-4 text-right">
           <span className="text-[10px] md:text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block whitespace-nowrap">
            ※삭제는 최윤하에게 요청하지 않으면 불가능. 신중히 쓸 것!※
          </span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6 shrink-0">
        <div className="flex flex-col gap-2">
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="이름"
              className="w-24 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-cy-orange"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={10}
              required
            />
            <div className="relative">
              <div 
                className="bg-orange-100 p-1.5 rounded-full text-cy-orange clickable cursor-pointer hover:bg-orange-200 transition-colors"
                onClick={handleSmileClick}
              >
                <Smile size={16} />
              </div>
              {/* Speech Bubble Tooltip */}
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-cy-dark text-white text-[10px] px-2 py-1 rounded shadow-lg animate-fade-in z-20 font-pixel">
                  실명으로 해주면 감사하겠어
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-cy-dark"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <textarea
              placeholder="내용을 적어주세요..."
              className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-cy-orange resize-none h-10 md:h-12 min-w-0"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <button 
              type="submit"
              className="bg-cy-dark text-white rounded px-4 hover:bg-gray-700 transition-colors clickable flex items-center justify-center shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </form>

      {/* Entries List */}
      <div className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-[200px]">
        {entries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 py-10">
            아직 작성된 방명록이 없어요. <br/>첫 방문자가 되어주세요!
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white border border-gray-100 p-3 rounded shadow-sm flex flex-col relative group">
              {isAdmin && (
                <button 
                  type="button"
                  onClick={(e) => handleDeleteClick(e, entry.id)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 clickable p-1 z-10"
                  title="삭제"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-cy-orange text-sm">{entry.name}</span>
                <span className="text-xs text-gray-400 pr-4">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Guestbook;