import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { subscribeToAuth, incrementVisitorCount } from './services/firebase';
import AdminModal from './components/AdminModal';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Log from './pages/Log';
import Gallery from './pages/Gallery';
import GuestbookPage from './pages/GuestbookPage';
import FortunePage from './pages/FortunePage';
import RPGPage from './pages/RPGPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth Check
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Visitor Counter Logic (Execute once per session)
    const sessionKey = 'hasVisitedSession';
    if (!sessionStorage.getItem(sessionKey)) {
      incrementVisitorCount().then(() => {
        sessionStorage.setItem(sessionKey, 'true');
        console.log('Visitor count incremented');
      }).catch(err => console.error('Visitor count error:', err));
    }

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="animate-bounce font-pixel text-xl text-cy-orange">로딩 중...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <div className="relative w-full max-w-4xl mx-auto h-full">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/guestbook" element={<GuestbookPage user={user} />} />
            <Route path="/fortune" element={<FortunePage user={user} />} />
            <Route path="/rpg" element={<RPGPage user={user} />} />
            <Route path="/log" element={<Log user={user} />} />
            <Route path="/log/:id" element={<Log user={user} />} />
            <Route path="/gallery" element={<Gallery user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <AdminModal user={user} />
        </div>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
