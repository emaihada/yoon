import React, { useState } from 'react';
import DraggableWindow from './DraggableWindow';
import { Sword, Shield, Zap, Target, FlaskConical, Scroll, Ghost, Skull, Gem, Crown } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  count: number;
  price?: number;
  desc?: string;
}

interface InventoryProps {
  onClose: () => void;
  items: Item[];
  onUseItem: (id: string) => void;
}

export const getItemIcon = (id: string) => {
  if (id === 'item_potion') return (
    <div className="w-6 h-6 relative">
      <div className="absolute top-0 left-2 w-2 h-2 bg-[#aaaaaa]" />
      <div className="absolute top-[6px] left-1 w-4 h-4 rounded-full bg-red-600" />
      <div className="absolute top-2 left-[6px] w-1 h-1 bg-white/40 rounded-full" />
    </div>
  );
  if (id === 'item_potion_blue') return (
    <div className="w-6 h-6 relative">
      <div className="absolute top-0 left-2 w-2 h-2 bg-[#aaaaaa]" />
      <div className="absolute top-[6px] left-1 w-4 h-4 rounded-full bg-blue-600" />
      <div className="absolute top-2 left-[6px] w-1 h-1 bg-white/40 rounded-full" />
    </div>
  );
  if (id === 'weapon_sword') return (
    <div className="w-6 h-6 relative rotate-45">
      <div className="absolute top-0 left-2 w-2 h-4 bg-gray-300" />
      <div className="absolute top-4 left-1 w-4 h-1 bg-amber-900" />
      <div className="absolute top-5 left-2 w-2 h-2 bg-amber-950" />
    </div>
  );
  if (id === 'weapon_bow') return (
    <div className="w-6 h-6 relative">
      <div className="absolute inset-1 border-2 border-amber-700 rounded-full border-l-transparent" />
      <div className="absolute top-1 bottom-1 left-3 w-[1px] bg-white/30" />
    </div>
  );
  if (id === 'weapon_staff') return (
    <div className="w-6 h-6 relative">
      <div className="absolute top-0 bottom-0 left-2 w-2 bg-amber-900" />
      <div className="absolute top-0 left-1 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_5px_blue]" />
    </div>
  );
  if (id === 'armor_leather') return (
    <div className="w-6 h-6 relative">
      <div className="absolute top-1 left-1 right-1 bottom-1 bg-amber-800 rounded-sm" />
      <div className="absolute top-1 left-2 right-2 h-2 bg-amber-700" />
    </div>
  );
  
  if (id === 'item_slime_jelly') return <div className="w-5 h-5 bg-[#00ffaa] rounded-full opacity-80 shadow-[0_0_5px_#00ffaa]" />;
  if (id === 'item_wolf_fur') return <div className="w-6 h-4 bg-[#888888] rounded-sm border border-black/20" />;
  if (id === 'item_goblin_ear') return <div className="w-4 h-6 bg-[#55aa00] rounded-l-full border border-black/20" />;
  if (id === 'item_orc_tooth') return <div className="w-3 h-5 bg-[#eeeeee] rounded-b-full border border-black/20" />;
  if (id === 'item_ectoplasm') return <div className="w-6 h-6 bg-[#aaaaff] rounded-full opacity-40 shadow-[0_0_8px_#aaaaff]" />;
  if (id === 'item_dragon_heart') return <div className="w-6 h-6 bg-[#ff0000] rounded-md shadow-[0_0_10px_red] animate-pulse" />;
  
  // New Items
  if (id === 'weapon_sickle') return (
    <div className="w-6 h-6 relative rotate-45">
      <div className="absolute top-2 left-1 w-4 h-1 bg-gray-400 rounded-full" />
      <div className="absolute top-3 left-2 w-1 h-3 bg-amber-900" />
    </div>
  );
  if (id === 'weapon_mace') return (
    <div className="w-6 h-6 relative">
      <div className="absolute top-1 left-2 w-2 h-2 bg-gray-600 rounded-full" />
      <div className="absolute top-3 left-2.5 w-1 h-3 bg-amber-900" />
    </div>
  );
  if (id === 'armor_shield') return (
    <div className="w-6 h-6 relative">
      <div className="absolute inset-1 bg-amber-900 rounded-sm border-2 border-gray-400" />
    </div>
  );
  if (id === 'armor_iron') return (
    <div className="w-6 h-6 relative">
      <div className="absolute inset-1 bg-gray-300 rounded-sm" />
      <div className="absolute top-2 left-2 right-2 h-2 bg-gray-400" />
    </div>
  );
  if (id === 'weapon_chalk') return <div className="w-2 h-4 bg-white rounded-sm rotate-12" />;
  if (id === 'weapon_book') return <div className="w-5 h-6 bg-purple-700 rounded-sm border-l-2 border-purple-400" />;
  if (id === 'item_potion_exp') return (
    <div className="w-6 h-6 relative">
      <div className="absolute top-0 left-2 w-2 h-2 bg-[#aaaaaa]" />
      <div className="absolute top-[6px] left-1 w-4 h-4 rounded-full bg-purple-600" />
    </div>
  );
  if (id === 'weapon_spear') return (
    <div className="w-6 h-6 relative rotate-45">
      <div className="absolute top-0 left-2.5 w-1 h-6 bg-amber-900" />
      <div className="absolute top-0 left-2 w-2 h-2 bg-gray-300 clip-path-triangle" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
    </div>
  );
  if (id === 'weapon_shotgun') return (
    <div className="w-6 h-4 bg-gray-800 rounded-sm relative">
      <div className="absolute right-0 top-1 w-2 h-2 bg-amber-900" />
    </div>
  );
  if (id === 'armor_fur') return <div className="w-6 h-6 bg-amber-900 rounded-md border-t-4 border-white/30" />;

  return <Gem className="w-6 h-6 text-blue-500" />;
};

const getItemDesc = (id: string, name: string) => {
  if (id === 'item_potion') return '체력을 50 회복합니다.';
  if (id === 'item_potion_blue') return '마나를 50 회복합니다.';
  if (id === 'scroll') return '마을로 즉시 귀환합니다.';
  if (id === 'weapon_sword') return '공격력 +5 (근거리)';
  if (id === 'weapon_bow') return '공격력 +7 (원거리)';
  if (id === 'weapon_staff') return '공격력 +8 (원거리)';
  if (id === 'armor_leather') return '방어력 +5';
  if (id === 'item_slime_jelly') return '슬라임의 끈적한 점액입니다. (전리품)';
  if (id === 'item_wolf_fur') return '부드러운 늑대의 가죽입니다. (전리품)';
  if (id === 'item_goblin_ear') return '고블린의 뾰족한 귀입니다. (전리품)';
  if (id === 'item_orc_tooth') return '단단한 오크의 이빨입니다. (전리품)';
  if (id === 'item_ectoplasm') return '차가운 망령의 파편입니다. (전리품)';
  if (id === 'item_dragon_heart') return '강력한 마력이 느껴지는 드래곤의 심장입니다. (전리품)';
  
  if (id === 'weapon_sickle') return '공격력 +3 (근거리)';
  if (id === 'weapon_mace') return '공격력 +12 (근거리)';
  if (id === 'armor_shield') return '방어력 +4';
  if (id === 'armor_iron') return '방어력 +10';
  if (id === 'weapon_chalk') return '공격력 +4 (투척)';
  if (id === 'weapon_book') return '공격력 +9 (투척)';
  if (id === 'item_potion_exp') return '경험치를 50 획득합니다.';
  if (id === 'weapon_spear') return '공격력 +6 (근거리)';
  if (id === 'weapon_shotgun') return '공격력 +18 (원거리)';
  if (id === 'armor_fur') return '방어력 +3';
  if (id === 'weapon_mace') return '공격력 +12 (근거리)';

  return '알 수 없는 아이템입니다.';
};

const Inventory: React.FC<InventoryProps> = ({ onClose, items, onUseItem }) => {
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent, item: Item) => {
    setHoveredItem(item);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <DraggableWindow title="인벤토리 (가방)" onClose={onClose}>
        <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full sm:w-64">
          {items.map(item => (
            <div 
              key={item.id} 
              className="w-10 h-10 sm:w-12 sm:h-12 bg-[#111] border-t-[#111] border-l-[#111] border-b-[#555] border-r-[#555] border-2 flex items-center justify-center relative cursor-pointer hover:bg-[#222]"
              onClick={() => onUseItem(item.id)}
              onMouseMove={(e) => handleMouseMove(e, item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {getItemIcon(item.id)}
              <span className="absolute bottom-0 right-1 text-[10px] font-bold text-yellow-500 drop-shadow-md">
                {item.count}
              </span>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 16 - items.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-10 h-10 sm:w-12 sm:h-12 bg-[#111] border-t-[#111] border-l-[#111] border-b-[#555] border-r-[#555] border-2" />
          ))}
        </div>
      </DraggableWindow>

      {/* Tooltip */}
      {hoveredItem && (
        <div 
          className="fixed z-[100] bg-[#1a1a1a] border-2 border-[#555] p-2 text-white pointer-events-none shadow-lg w-48 font-['Galmuri9']"
          style={{ 
            left: Math.min(tooltipPos.x + 15, window.innerWidth - 200), 
            top: Math.min(tooltipPos.y + 15, window.innerHeight - 100) 
          }}
        >
          <div className="font-bold text-yellow-400 mb-1">{hoveredItem.name}</div>
          <div className="text-xs text-gray-300 mb-1">{getItemDesc(hoveredItem.id, hoveredItem.name)}</div>
          <div className="text-[10px] text-gray-500 text-right">클릭하여 사용/장착</div>
        </div>
      )}
    </>
  );
};

export default Inventory;
