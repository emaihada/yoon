import React, { useState, useEffect } from 'react';
import { loginAdmin, logoutAdmin, getVisitorCount, resetAdminPassword } from '../services/firebase';
import { User } from 'firebase/auth';
import { X, Lock, LogOut, Users } from 'lucide-react';

interface AdminModalProps {
  user: User | null;
}

const AdminModal: React.FC<AdminModalProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // Fetch visitor count when modal opens and user is logged in
  useEffect(() => {
    if (isOpen && user) {
      getVisitorCount().then(count => setVisitorCount(count));
    }
  }, [isOpen, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      await loginAdmin(email, password);
      setIsOpen(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error("Login Error:", err);
      // Handle specific Firebase Auth errors
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Firebase Console에서 Email/Password 로그인을 활성화해주세요.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호는 6자리 이상이어야 합니다.');
      } else {
        setError('로그인 오류: ' + (err.code || err.message));
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('비밀번호를 재설정할 이메일을 입력해주세요.');
      return;
    }
    setError('');
    setMessage('');
    try {
      await resetAdminPassword(email);
      setMessage('비밀번호 재설정 이메일이 전송되었습니다. 이메일함을 확인해주세요.');
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('가입되지 않은 이메일입니다.');
      } else {
        setError('비밀번호 재설정 오류: ' + (err.code || err.message));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      setIsOpen(false);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  // Hidden trigger in footer
  return (
    <>
      <div className="fixed bottom-2 right-2 md:bottom-4 md:right-4 z-50 opacity-20 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsOpen(true)}
          className="text-gray-400 hover:text-cy-dark clickable"
        >
          <Lock size={12} />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm relative shadow-2xl">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 clickable"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold font-pixel mb-4 text-center">관리자 접속</h2>

            {user ? (
              <div className="text-center space-y-4">
                <div className="bg-gray-50 p-4 rounded border border-gray-100 mb-4">
                  <p className="text-green-600 font-bold mb-1">{user.email}</p>
                  <p className="text-xs text-gray-500 mb-3">관리자 계정으로 접속 중입니다.</p>
                  
                  {/* Total Visitors Display */}
                  <div className="flex items-center justify-center gap-2 text-cy-orange font-bold font-pixel text-lg border-t border-gray-200 pt-3 mt-2">
                    <Users size={20} />
                    <span>Total: {visitorCount !== null ? visitorCount.toLocaleString() : '...'}</span>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-500 text-white py-2 rounded flex items-center justify-center gap-2 clickable hover:bg-red-600 transition-colors"
                >
                  <LogOut size={16} /> 로그아웃
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input 
                    type="email" 
                    placeholder="이메일" 
                    className="w-full border p-2 rounded focus:outline-none focus:border-cy-orange text-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input 
                    type="password" 
                    placeholder="비밀번호" 
                    className="w-full border p-2 rounded focus:outline-none focus:border-cy-orange text-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-500 text-xs p-2 rounded border border-red-100">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="bg-green-50 text-green-600 text-xs p-2 rounded border border-green-100">
                    {message}
                  </div>
                )}
                
                <button 
                  type="submit"
                  className="w-full bg-cy-dark text-white py-2 rounded font-bold clickable hover:bg-gray-700 transition-colors"
                >
                  로그인
                </button>

                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[10px] text-gray-500 hover:text-cy-blue underline clickable"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </div>

                <div className="text-[10px] text-gray-400 text-center">
                  * Firebase Console에서 Authentication &gt; Email/Password가 활성화되어 있어야 하며, 해당 이메일의 사용자가 등록되어 있어야 합니다.
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminModal;