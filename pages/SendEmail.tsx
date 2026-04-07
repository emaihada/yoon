import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { User } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import { Send, Loader2, Link as LinkIcon, Users, Copy } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface PageProps {
  user: User | null;
}

interface Subscriber {
  name: string;
  email: string;
}

const SendEmail: React.FC<PageProps> = ({ user }) => {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'subscribers'), (snapshot) => {
      const subs = snapshot.docs.map(doc => ({
        name: doc.data().name,
        email: doc.data().email
      }));
      setSubscribers(subs);
    }, (error) => {
      console.error("Error fetching subscribers:", error);
    });
    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <Layout title="메일 보내기">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 font-pixel">관리자만 접근할 수 있습니다.</p>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setStatus(null);

    try {
      // 외부 이미지 URL이 없으면 투명 이미지 사용
      const finalImageUrl = imageUrl.trim() !== '' 
        ? imageUrl.trim() 
        : 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Transparent.gif';

      setStatus({ type: 'success', text: '메일을 전송하는 중...' });
      
      const templateParams = {
        to_email: toEmail,
        subject: subject,
        message: message,
        image_url: finalImageUrl,
      };
      
      await emailjs.send(
        'service_nfrmafi',
        'template_ittrvg8',
        templateParams,
        'hnZQk8gozqfhJvxSU'
      );
      
      setStatus({ type: 'success', text: '메일이 성공적으로 전송되었습니다!' });
      setToEmail('');
      setSubject('');
      setMessage('');
      setImageUrl('');
    } catch (error) {
      console.error('EmailJS Error:', error);
      setStatus({ type: 'error', text: '메일 전송에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSending(false);
    }
  };

  const copyAllEmails = () => {
    const emails = subscribers.map(s => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    alert('모든 구독자의 이메일이 복사되었습니다.');
  };

  return (
    <Layout title="메일 보내기">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Email Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-6 font-pixel leading-relaxed">
            관리자 전용 메일 발송 페이지입니다.<br/>
            외부 이미지 링크를 입력하면 메일 본문 상단에 함께 전송됩니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 font-pixel">받는 사람 이메일</label>
              <input
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-cy-blue outline-none font-sans"
                placeholder="example@email.com (여러 명일 경우 쉼표로 구분)"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 font-pixel">제목</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-cy-blue outline-none font-sans"
                placeholder="메일 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 font-pixel">내용</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-cy-blue outline-none h-48 resize-none font-sans"
                placeholder="메일 내용을 자유롭게 작성하세요..."
              />
            </div>

            {/* 외부 이미지 링크 입력 영역 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 font-pixel">외부 이미지 링크 (선택)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-cy-blue outline-none font-sans"
                    placeholder="https://i.postimg.cc/... (이미지 주소 복사 붙여넣기)"
                  />
                </div>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 font-pixel text-sm"
                  >
                    지우기
                  </button>
                )}
              </div>
              
              {/* 이미지 미리보기 */}
              {imageUrl && (
                <div className="mt-3 relative inline-block">
                  <p className="text-xs text-gray-500 mb-1 font-pixel">미리보기:</p>
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="max-h-48 rounded-lg border border-gray-200 object-contain bg-gray-50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Transparent.gif';
                    }}
                  />
                </div>
              )}
            </div>

            {status && (
              <div className={`p-3 rounded font-pixel text-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {status.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-cy-blue text-white font-bold font-pixel py-3 rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isSending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  전송 중...
                </>
              ) : (
                <>
                  <Send size={18} />
                  메일 보내기
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Subscriber List */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit max-h-[800px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h3 className="font-bold font-pixel text-gray-800 flex items-center gap-2">
              <Users size={18} className="text-cy-blue" />
              구독자 목록 ({subscribers.length})
            </h3>
            {subscribers.length > 0 && (
              <button 
                onClick={copyAllEmails}
                className="text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-pixel transition-colors"
                title="모든 이메일 복사"
              >
                <Copy size={12} />
                복사
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {subscribers.length === 0 ? (
              <p className="text-sm text-gray-500 font-pixel text-center py-8">
                아직 구독자가 없습니다.
              </p>
            ) : (
              subscribers.map((sub, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border border-gray-100 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-pixel text-sm text-gray-800">{sub.name}</span>
                    <button 
                      onClick={() => setToEmail(prev => prev ? `${prev}, ${sub.email}` : sub.email)}
                      className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-pixel hover:bg-blue-200"
                    >
                      추가
                    </button>
                  </div>
                  <span className="text-xs text-gray-500 font-sans break-all">{sub.email}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default SendEmail;
