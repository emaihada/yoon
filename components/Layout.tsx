import React from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title = "최윤하의 홈피" }) => {
  return (
    // Outer Wrapper: Fixed to viewport.
    // Changed:
    // - Mobile: p-0 pb-16. This creates a 4rem (16) space at the bottom for the fixed Navigation bar.
    // - Desktop: md:p-6 (resets all padding including bottom to 1.5rem).
    <div className="fixed inset-0 w-full h-[100dvh] bg-gray-100 flex items-center justify-center overflow-hidden p-0 pb-16 md:p-6 box-border">
      
      {/* 
        Main Container (Blue Box): 
        - Mobile: h-full (fills the space above the nav bar), rounded-none (or slightly rounded if desired, keeping consistent)
        - Desktop: max-w-5xl (Wider), rounded-xl
      */}
      <div className="w-full max-w-5xl bg-cy-blue md:rounded-xl p-2 md:p-5 shadow-2xl relative flex flex-col 
                      h-full md:h-[850px] md:max-h-[98vh] ring-1 ring-black/5 mx-auto">
        
        {/* Navigation Tabs */}
        <Navigation />

        {/* Inner White Box */}
        <div className="bg-white rounded-lg border border-gray-300 shadow-inner flex flex-col h-full overflow-hidden relative z-10">
          
          {/* Content Area: The ONLY part that scrolls */}
          {/* Changed: pb-20 reduced to pb-4 because the container itself now ends above the nav bar */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-4 md:p-6 md:pb-6">
             
             {/* Header */}
             <h1 className="text-xl md:text-2xl font-bold text-cy-orange mb-4 md:mb-6 font-pixel tracking-widest border-b-2 border-gray-100 pb-3 shrink-0">
              {title}
            </h1>
            
            {/* Child content wrapper */}
            <div className="pb-4">
              {children}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Layout;