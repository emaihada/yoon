import React from 'react';
import DraggableWindow from './DraggableWindow';
import { Sword, Shield } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { rtdb } from '../../services/firebase';
import { getItemIcon } from './Inventory';

interface EquipmentProps {
  onClose: () => void;
  stats: any;
  onUnequip: (type: 'weapon' | 'armor') => void;
}

const Equipment: React.FC<EquipmentProps> = ({ onClose, stats, onUnequip }) => {
  const [leaderNickname, setLeaderNickname] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchLeader = async () => {
      if (!stats.guild) return;
      try {
        const guildsRef = ref(rtdb, 'guilds');
        const snapshot = await get(guildsRef);
        if (snapshot.exists()) {
          const guilds = snapshot.val();
          const guildData = Object.values(guilds).find((g: any) => g.name === stats.guild) as any;
          if (guildData && guildData.leader) {
            const leaderRef = ref(rtdb, `users/${guildData.leader}/nickname`);
            const leaderSnap = await get(leaderRef);
            if (leaderSnap.exists()) {
              setLeaderNickname(leaderSnap.val());
            }
          }
        }
      } catch (e) {
        console.error('Error fetching guild leader:', e);
      }
    };
    fetchLeader();
  }, [stats.guild]);

  return (
    <DraggableWindow title="장비창" onClose={onClose}>
      <div className="flex flex-col items-center gap-4 w-full sm:w-72 bg-[#1a1a1a] p-4 border-2 border-[#444]">
        <div className="flex gap-4 w-full">
          {/* Character Preview */}
          <div className="w-32 h-48 bg-[#111] border-2 border-[#333] flex flex-col items-center justify-center relative rounded shadow-inner overflow-hidden">
            {/* Pixel Character Representation */}
            <div className="relative w-24 h-24 flex items-center justify-center scale-150">
              {/* Head */}
              <div className="absolute top-0 w-6 h-5 bg-[#ffccaa] rounded-sm" />
              {/* Eyes */}
              <div className="absolute top-2 left-1 w-1 h-1 bg-black" />
              <div className="absolute top-2 right-1 w-1 h-1 bg-black" />
              {/* Hair */}
              <div className="absolute -top-1 w-6 h-2 bg-[#333]" />
              {/* Body */}
              <div className={`absolute top-5 w-8 h-5 ${stats.appearance === 'red' ? 'bg-red-600' : stats.appearance === 'green' ? 'bg-green-600' : 'bg-blue-600'} rounded-t-sm`} />
              {/* Feet */}
              <div className="absolute top-10 left-1 w-3 h-1 bg-[#222]" />
              <div className="absolute top-10 right-1 w-3 h-1 bg-[#222]" />
              
              {/* Armor Overlay */}
              {stats.equippedArmor && (
                <div className="absolute top-5 w-8 h-5 bg-black/30 rounded-t-sm flex items-center justify-center">
                  <div className="scale-75 opacity-80">
                    {getItemIcon(stats.equippedArmor)}
                  </div>
                </div>
              )}
              
              {/* Weapon Overlay */}
              {stats.equippedWeapon && (
                <div className="absolute -right-3 top-4 scale-75">
                  {getItemIcon(stats.equippedWeapon)}
                </div>
              )}
            </div>
            <div className="absolute bottom-2 text-[8px] text-gray-500 uppercase tracking-tighter">Character Preview</div>
          </div>
          
          {/* Equipment Slots */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#888] mb-1 uppercase font-bold">무기</span>
              <div 
                onClick={() => stats.equippedWeapon && onUnequip('weapon')}
                className={`w-14 h-14 border-2 flex items-center justify-center cursor-pointer transition-all rounded shadow-md
                  ${stats.equippedWeapon ? 'border-yellow-500 bg-yellow-900/30 hover:bg-yellow-900/50' : 'border-[#333] bg-[#111] hover:border-[#444]'}`}
              >
                {stats.equippedWeapon ? getItemIcon(stats.equippedWeapon) : <Sword className="w-6 h-6 text-[#222]" />}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#888] mb-1 uppercase font-bold">방어구</span>
              <div 
                onClick={() => stats.equippedArmor && onUnequip('armor')}
                className={`w-14 h-14 border-2 flex items-center justify-center cursor-pointer transition-all rounded shadow-md
                  ${stats.equippedArmor ? 'border-blue-500 bg-blue-900/30 hover:bg-blue-900/50' : 'border-[#333] bg-[#111] hover:border-[#444]'}`}
              >
                {stats.equippedArmor ? getItemIcon(stats.equippedArmor) : <Shield className="w-6 h-6 text-[#222]" />}
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="w-full mt-2 text-xs sm:text-sm bg-black/40 p-3 border-2 border-[#333] text-[#d4c4a8] flex flex-col gap-2 rounded">
          <div className="flex justify-between border-b border-[#333] pb-1">
            <span className="text-gray-400">레벨</span> 
            <span className="text-yellow-500 font-bold">{stats.level}</span>
          </div>
          <div className="flex justify-between border-b border-[#333] pb-1">
            <span className="text-gray-400">공격력</span> 
            <span className="text-red-500 font-bold">{stats.atk || 10}</span>
          </div>
          <div className="flex justify-between border-b border-[#333] pb-1">
            <span className="text-gray-400">방어력</span> 
            <span className="text-blue-400 font-bold">{stats.def || 10}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">길드</span> 
            <span className="text-green-400">
              {stats.guild ? (
                <>
                  {stats.guild}
                  {leaderNickname && (
                    <span className="text-[10px] text-gray-500 ml-1">
                      (길드장-{leaderNickname})
                    </span>
                  )}
                </>
              ) : '없음'}
            </span>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};

export default Equipment;
