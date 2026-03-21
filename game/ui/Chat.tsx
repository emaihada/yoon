import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { gameDb, ref, push, onChildAdded, serverTimestamp } from '../firebase/gameFirebase';
import { off, query, limitToLast } from 'firebase/database';
import { X, MessageSquare } from 'lucide-react';

interface ChatProps {
  user: User | null;
  nickname?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  type?: 'system' | 'user';
}

const Chat: React.FC<ChatProps> = ({ user, nickname }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [popupMessages, setPopupMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMinimizedRef = useRef(isMinimized);
  const mountTimeRef = useRef(Date.now());

  const getChatSession = () => {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    return Math.floor(now / tenMinutes);
  };

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  useEffect(() => {
    if (!gameDb) return;

    const session = getChatSession();
    const chatPath = `chat_session_${session}`;
    const chatRef = query(ref(gameDb, chatPath), limitToLast(50));
    
    const listener = onChildAdded(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const newMsg = { id: snapshot.key as string, ...data };
        
        if (!newMsg.popupOnly) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].slice(-50);
          });
        }

        // Handle popup for system messages or explicit popupOnly messages
        const isInitialLoad = Date.now() - mountTimeRef.current < 1000;
        if (!isInitialLoad && (newMsg.popupOnly || (newMsg.type === 'system' && isMinimizedRef.current))) {
          setPopupMessages(p => [...p, newMsg].slice(-3));
          setTimeout(() => {
            setPopupMessages(p => p.filter(m => m.id !== newMsg.id));
          }, 4000);
        }
      }
    });

    const handleLocalSystemMsg = (e: any) => {
      const text = e.detail.text.startsWith('[시스템]') ? e.detail.text : `[시스템] ${e.detail.text}`;
      const popupOnly = e.detail.popupOnly;
      const newMsg: ChatMessage = {
        id: `local-${Date.now()}-${Math.random()}`,
        text: text,
        sender: 'System',
        timestamp: Date.now(),
        type: 'system'
      };
      
      if (!popupOnly) {
        setMessages(prev => [...prev, newMsg].slice(-50));
      }
      
      if (isMinimizedRef.current || popupOnly) {
        setPopupMessages(p => [...p, newMsg].slice(-3));
        setTimeout(() => {
          setPopupMessages(p => p.filter(m => m.id !== newMsg.id));
        }, 4000);
      }
    };

    window.addEventListener('local-system-message', handleLocalSystemMsg);

    return () => {
      off(ref(gameDb, chatPath), 'child_added', listener);
      window.removeEventListener('local-system-message', handleLocalSystemMsg);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !gameDb) return;

    const session = getChatSession();
    const chatPath = `chat_session_${session}`;
    const chatRef = ref(gameDb, chatPath);
    push(chatRef, {
      text: input,
      sender: nickname || user?.displayName || '익명',
      timestamp: serverTimestamp()
    });

    setInput('');
  };

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `[${month}/${day} ${hours}:${minutes}]`;
  };

  return (
    <>
      {/* System Message Popups */}
      {isMinimized && popupMessages.length > 0 && (
        <div className="absolute bottom-16 left-4 z-50 flex flex-col gap-2 pointer-events-none">
          {popupMessages.map(msg => (
            <div key={`popup-${msg.id}`} className="bg-black/80 border border-yellow-600 text-yellow-400 px-4 py-2 rounded shadow-lg animate-fade-in-up text-sm">
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {isMinimized ? (
        <button 
          onClick={() => setIsMinimized(false)}
          className="absolute bottom-4 left-4 z-50 bg-gray-800 text-white px-4 py-2 rounded border border-[#555] hover:bg-gray-700 flex items-center gap-2 shadow-lg transition-all"
        >
          <MessageSquare size={16} /> 채팅 열기
        </button>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/80 border-t border-[#444] flex flex-col pointer-events-auto z-50">
          {/* Header for toggle */}
          <div className="flex justify-between items-center bg-[#222] px-3 py-1 border-b border-[#444]">
            <span className="text-xs text-gray-400">실시간 채팅 (10분마다 초기화)</span>
            <button onClick={() => setIsMinimized(true)} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-sm">
            {messages.length === 0 && (
              <div className="text-gray-500 italic">아직 메시지가 없습니다</div>
            )}
            {messages.map(msg => {
              const isQuestComplete = msg.text.includes('퀘스트 완료');
              return (
                <div key={msg.id} className="break-words flex items-center gap-1">
                  {msg.type === 'system' ? (
                    <span className={`${isQuestComplete ? 'text-red-500' : 'text-yellow-400'} font-bold`}>{msg.text}</span>
                  ) : (
                    <>
                      <span className="text-green-500 font-bold shrink-0">[{msg.sender}]</span>
                      <span className="text-white ml-1">{msg.text}</span>
                    </>
                  )}
                  <span className="text-gray-500 text-[10px] ml-auto shrink-0">{formatTime(msg.timestamp)}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="flex p-2 bg-[#222] border-t border-[#444]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-black text-white px-2 py-1 outline-none border border-[#555] focus:border-cy-orange"
              maxLength={100}
            />
            <button 
              type="submit"
              className="ml-2 px-4 py-1 bg-gray-700 text-white border border-[#555] hover:bg-gray-600 active:bg-gray-800"
            >
              전송
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chat;
