import React, { useState, useEffect } from 'react';
import DraggableWindow from './DraggableWindow';

interface ShopWindowProps {
  onClose: () => void;
  playerGold: number;
  onBuy: (item: any) => void;
  onSell: (item: any) => void;
  onSellAll?: (item: any) => void;
  inventory: any[];
  shopType?: 'general' | 'blacksmith' | 'mage' | 'hunter';
}

const ShopWindow: React.FC<ShopWindowProps> = ({ onClose, playerGold, onBuy, onSell, onSellAll, inventory, shopType = 'general' }) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  const generalItems = [
    { id: 'item_potion', name: '빨간 물약', price: 50, desc: '체력 회복' },
    { id: 'scroll', name: '귀환 주문서', price: 200, desc: '마을로 이동' }
  ];

  const blacksmithItems = [
    { id: 'weapon_sickle', name: '낫', price: 300, desc: '공격력 +3' },
    { id: 'weapon_sword', name: '철검', price: 800, desc: '공격력 +7' },
    { id: 'weapon_mace', name: '철퇴', price: 1500, desc: '공격력 +12' },
    { id: 'armor_shield', name: '방패', price: 400, desc: '방어력 +4' },
    { id: 'armor_iron', name: '철갑옷', price: 1200, desc: '방어력 +10' }
  ];

  const mageItems = [
    { id: 'weapon_chalk', name: '분필', price: 400, desc: '공격력 +4 (투척)' },
    { id: 'weapon_book', name: '마도서', price: 1000, desc: '공격력 +9 (투척)' },
    { id: 'weapon_staff', name: '마법 지팡이', price: 2000, desc: '공격력 +15 (원거리)' },
    { id: 'item_potion_blue', name: '파란 물약', price: 100, desc: '마나 회복' },
    { id: 'item_potion_exp', name: '경험치 물약', price: 500, desc: '경험치 +50' }
  ];

  const hunterItems = [
    { id: 'weapon_spear', name: '창', price: 600, desc: '공격력 +6' },
    { id: 'weapon_bow', name: '활', price: 1100, desc: '공격력 +10 (원거리)' },
    { id: 'weapon_shotgun', name: '엽총', price: 2500, desc: '공격력 +18 (원거리)' },
    { id: 'armor_fur', name: '털가죽 옷', price: 300, desc: '방어력 +3' },
    { id: 'armor_leather', name: '가죽갑옷', price: 700, desc: '방어력 +7' }
  ];

  const shopItems = shopType === 'blacksmith' ? blacksmithItems : shopType === 'mage' ? mageItems : shopType === 'hunter' ? hunterItems : generalItems;
  const title = shopType === 'blacksmith' ? '대장간' : shopType === 'mage' ? '마법 상점' : shopType === 'hunter' ? '사냥꾼 상점' : '상점';

  useEffect(() => {
    if (shopType !== 'general') {
      setTab('buy');
    }
  }, [shopType]);

  return (
    <DraggableWindow title={title} onClose={onClose}>
      <div className="w-[280px] sm:w-[350px] p-2 bg-[#1a1a1a] text-[#d4c4a8] font-['Galmuri9']">
        <div className="flex justify-between mb-4 border-b-2 border-[#555] pb-2">
          <div className="flex gap-2">
            <button 
              className={`px-2 py-1 ${tab === 'buy' ? 'bg-[#333] text-white' : 'bg-[#111] text-gray-400'} border-2 border-[#555] hover:bg-[#444]`}
              onClick={() => setTab('buy')}
            >구매</button>
            {shopType === 'general' && (
              <button 
                className={`px-2 py-1 ${tab === 'sell' ? 'bg-[#333] text-white' : 'bg-[#111] text-gray-400'} border-2 border-[#555] hover:bg-[#444]`}
                onClick={() => setTab('sell')}
              >판매</button>
            )}
          </div>
          <div className="text-yellow-500 font-bold">{playerGold} G</div>
        </div>

        <div className="h-64 overflow-y-auto pr-2">
          {tab === 'buy' ? (
            <div className="flex flex-col gap-2">
              {shopItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-[#222] border border-[#444]">
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-[10px] text-gray-400">{item.desc}</div>
                  </div>
                  <button 
                    className="px-3 py-1 bg-[#3a5a2a] text-white border-2 border-[#4a6a3a] hover:bg-[#4a6a3a] disabled:opacity-50"
                    onClick={() => onBuy(item)}
                    disabled={playerGold < item.price}
                  >
                    {item.price} G
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {inventory.length === 0 ? (
                <div className="text-center text-gray-500 py-4">판매할 아이템이 없습니다.</div>
              ) : (
                inventory.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-[#222] border border-[#444]">
                    <div>
                      <div className="font-bold">{item.name} <span className="text-yellow-500 text-xs">x{item.count}</span></div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        className="px-2 py-1 bg-[#8b0000] text-white border-2 border-[#a00000] hover:bg-[#a00000] text-xs"
                        onClick={() => onSell(item)}
                      >
                        {Math.floor((item.price || 10) * 0.5)} G
                      </button>
                      <button 
                        className="px-2 py-1 bg-[#444] text-white border-2 border-[#666] hover:bg-[#555] text-xs"
                        onClick={() => (onSellAll as any)(item)}
                      >
                        전부 판매
                      </button>
                    </div>
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

export default ShopWindow;
