import React from 'react';
import { Home, BookOpen, Image, MessageSquareText, CalendarHeart, Gamepad2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { id: 'home', label: '홈', icon: Home, path: '/' },
  { id: 'guestbook', label: '방명록', icon: MessageSquareText, path: '/guestbook' },
  { id: 'log', label: '블로그', icon: BookOpen, path: '/log' },
  { id: 'picture-diary', label: '그림일기', icon: CalendarHeart, path: '/picture-diary' },
  { id: 'rpg', label: 'RPG', icon: Gamepad2, path: '/rpg' },
];

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* Desktop Side Tabs (Cyworld Style) */}
      <div className="hidden md:flex flex-col absolute -right-[84px] top-12 gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            className={`
              w-[80px] h-[40px] rounded-r-lg border-2 border-l-0 border-white shadow-md flex items-center justify-center text-sm font-bold transition-transform hover:translate-x-1
              ${currentPath === tab.path ? 'bg-white text-cy-dark translate-x-0' : 'bg-cy-blue text-white'}
            `}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPath === tab.path;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 clickable ${
                  isActive ? 'text-cy-orange' : 'text-gray-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-pixel">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navigation;