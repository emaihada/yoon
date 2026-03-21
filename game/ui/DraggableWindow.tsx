import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface DraggableWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  transparent?: boolean;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({ title, onClose, children, initialPosition, transparent }) => {
  const [position, setPosition] = useState(initialPosition || { x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  useEffect(() => {
    // If no initial position was provided, center it
    if (!initialPosition) {
      const centerX = Math.max(10, (window.innerWidth - 300) / 2);
      const centerY = Math.max(10, (window.innerHeight - 400) / 2);
      setPosition({ x: centerX, y: centerY });
    } else {
      // Clamp initial position to ensure it's visible on smaller screens
      const maxX = Math.max(10, window.innerWidth - 250);
      const maxY = Math.max(10, window.innerHeight - 300);
      setPosition(prev => ({
        x: Math.max(10, Math.min(prev.x, maxX)),
        y: Math.max(10, Math.min(prev.y, maxY))
      }));
    }
  }, [initialPosition]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      
      let newX = dragRef.current.initialX + dx;
      let newY = dragRef.current.initialY + dy;
      
      // 화면 밖으로 나가지 않도록 제한 (반응형)
      const maxX = window.innerWidth - 100; // 최소한 창의 일부는 보이도록
      const maxY = window.innerHeight - 50;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className={`absolute ${transparent ? 'bg-transparent' : 'bg-[#1a1a1a]'} border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] border-2 shadow-lg pointer-events-auto flex flex-col max-w-[90vw]`}
      style={{ left: position.x, top: position.y, minWidth: '200px', zIndex: isDragging ? 100 : 50 }}
    >
      {/* Header (Draggable Area) */}
      <div 
        className="bg-[#2b2b2b] p-1.5 px-3 flex justify-between items-center cursor-move select-none border-b-2 border-[#111]"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <span className="text-[#d4c4a8] font-bold text-xs sm:text-sm tracking-widest">{title}</span>
        <button onClick={onClose} className="text-[#888] hover:text-[#d4c4a8] transition-colors">
          <X size={16} />
        </button>
      </div>
      
      {/* Content */}
      <div className={`p-3 sm:p-4 text-[#d4c4a8] ${transparent ? 'bg-transparent' : 'bg-[#1a1a1a]'} overflow-y-auto max-h-[70vh]`}>
        {children}
      </div>
    </div>
  );
};

export default DraggableWindow;
