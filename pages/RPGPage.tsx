import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, rtdb } from '../services/firebase';
import { ref, get, set, update, push, serverTimestamp, onValue } from 'firebase/database';
import { initGame, destroyGame } from '../game/main';
import Inventory from '../game/ui/Inventory';
import Equipment from '../game/ui/Equipment';
import Chat from '../game/ui/Chat';
import DraggableWindow from '../game/ui/DraggableWindow';
import ShopWindow from '../game/ui/ShopWindow';
import QuestWindow from '../game/ui/QuestWindow';
import { X } from 'lucide-react';

interface RPGPageProps {
  user: User | null;
}

const RPGPage: React.FC<RPGPageProps> = ({ user }) => {
  useEffect(() => {
    const usersRef = ref(rtdb, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.values(data) as any[];
        const sorted = users.sort((a, b) => b.level - a.level);
        setRanking(sorted.slice(0, 3));
      }
    });
  }, []);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'login' | 'loading' | 'main_menu' | 'creation' | 'playing' | 'error'>('login');
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [playerData, setPlayerData] = useState<any>(null);
  const [isInventoryOpen, setInventoryOpen] = useState(false);
  const [isEquipmentOpen, setEquipmentOpen] = useState(false);
  const [isGuildOpen, setGuildOpen] = useState(false);
  const [isQuestOpen, setQuestOpen] = useState(false);
  const [isRankingOpen, setRankingOpen] = useState(false);
  const [isMinimapOpen, setMinimapOpen] = useState(true);
  const [minimapZoom, setMinimapZoom] = useState<'small' | 'large'>('small');
  const [minimapWindowPos, setMinimapWindowPos] = useState({ x: 100, y: 100 });
  const [isShopOpen, setShopOpen] = useState(false);
  const [isChiefDialogOpen, setChiefDialogOpen] = useState(false);
  const [chiefDialogue, setChiefDialogue] = useState('');
  const [isInnDialogOpen, setInnDialogOpen] = useState(false);
  const [isBlacksmithOpen, setBlacksmithOpen] = useState(false);
  const [isMageShopOpen, setMageShopOpen] = useState(false);
  const [isHunterShopOpen, setHunterShopOpen] = useState(false);
  const [isGhostDialogOpen, setGhostDialogOpen] = useState(false);
  const [ghostDialogue, setGhostDialogue] = useState('');
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ 
    hp: 100, maxHp: 100, 
    mp: 50, maxMp: 50,
    exp: 0, maxExp: 100, 
    level: 1, atk: 10, def: 10, gold: 0, 
    guild: '',
    equippedWeapon: '',
    equippedArmor: '',
    nickname: '',
    x: 800,
    y: 800,
    dragonKills: 0
  });
  const [inventory, setInventory] = useState<any[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [isDead, setIsDead] = useState(false);

  // Character Creation State
  const [nickname, setNickname] = useState('');
  const [atk, setAtk] = useState(0);
  const [def, setDef] = useState(0);
  const [skinColor, setSkinColor] = useState('#ffccaa');
  const availablePoints = 20 - (atk + def);
  const hasJoinedRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const askConfirm = (text: string, action: () => void) => {
    setConfirmText(text);
    setConfirmAction(() => action);
    setShowConfirm(true);
  };

  useEffect(() => {
    if (!user) {
      setGameState('login');
      setPlayerData(null);
      return;
    }

    const loadData = async () => {
      try {
        console.log("Attempting to load user data from RTDB for:", user.uid);
        const snapshot = await get(ref(rtdb, `users/${user.uid}`));
        console.log("Snapshot exists:", snapshot.exists());
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.mp === undefined) {
            data.mp = 50;
            data.maxMp = 50;
          }
          setPlayerData(data);
          setStats(data);
          setInventory(data.inventory || []);
          setQuests(data.quests || []);
        } else {
          console.log("No user data found.");
          setNickname(user.displayName || '초보자');
          setPlayerData(null);
        }
        setGameState('login'); // Stay on login (Main Screen) even after loading
      } catch (e: any) {
        console.error("Failed to load user data", e);
        setErrorMsg(e.message || "데이터베이스 연결에 실패했습니다.");
        setGameState('error');
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (gameState !== 'playing' || !gameContainerRef.current || !playerData) return;
    
    if (!hasJoinedRef.current) {
      hasJoinedRef.current = true;
      const joinMsg = `${playerData.nickname || '플레이어'}님이 접속했습니다.`;
      // Local popup
      window.dispatchEvent(new CustomEvent('local-system-message', {
        detail: { text: joinMsg, popupOnly: true }
      }));
      // Global broadcast (popup only)
      const session = Math.floor(Date.now() / (10 * 60 * 1000));
      push(ref(rtdb, `chat_session_${session}`), {
        text: joinMsg,
        sender: 'System',
        timestamp: serverTimestamp(),
        type: 'system',
        popupOnly: true
      });
    }

    // Initialize Phaser game
    const game = initGame(gameContainerRef.current, user, playerData);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        setInventoryOpen(prev => !prev);
        setActiveWindow('inventory');
      }
      if (e.key === 'e' || e.key === 'E') {
        setEquipmentOpen(prev => !prev);
        setActiveWindow('equipment');
      }
      if (e.key === 'g' || e.key === 'G') {
        setGuildOpen(prev => !prev);
        setActiveWindow('guild');
      }
      if (e.key === 'q' || e.key === 'Q') {
        setQuestOpen(prev => !prev);
        setActiveWindow('quest');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Listen for events from Phaser
    const handleStatsUpdate = (e: any) => {
      setStats(prev => ({ ...prev, ...e.detail }));
    };
    window.addEventListener('player-stats-update', handleStatsUpdate);

    const handleDeath = () => setIsDead(true);
    window.addEventListener('player-death', handleDeath);

    const handleOpenShop = () => { setShopOpen(true); setActiveWindow('shop'); };
    window.addEventListener('open-shop', handleOpenShop);

    const handleOpenBlacksmith = () => { setBlacksmithOpen(true); setActiveWindow('blacksmith'); };
    window.addEventListener('open-blacksmith', handleOpenBlacksmith);

    const handleOpenMageShop = () => { setMageShopOpen(true); setActiveWindow('mageShop'); };
    window.addEventListener('open-mage-shop', handleOpenMageShop);

    const handleOpenHunterShop = () => { setHunterShopOpen(true); setActiveWindow('hunterShop'); };
    window.addEventListener('open-hunter-shop', handleOpenHunterShop);

    const handleOpenQuest = () => { setQuestOpen(true); setActiveWindow('quest'); };
    window.addEventListener('open-quest', handleOpenQuest);

    const handleOpenChiefDialog = () => {
      setChiefDialogue('허허, 마을에 온 걸 환영하네. 무슨 일이신가?');
      setChiefDialogOpen(true);
    };
    window.addEventListener('open-chief-dialog', handleOpenChiefDialog);

    const handleOpenInnDialog = () => {
      setInnDialogOpen(true);
    };
    window.addEventListener('open-inn-dialog', handleOpenInnDialog);

    const handleOpenGhostDialog = () => {
      setGhostDialogue('원망스럽도다...');
      setGhostDialogOpen(true);
    };
    window.addEventListener('open-ghost-dialog', handleOpenGhostDialog);

    const handleMonsterKilled = (e: any) => {
      const monsterType = e.detail.type;
      if (monsterType === 'dragon') {
        setStats(prev => {
          const newKills = (prev.dragonKills || 0) + 1;
          const newStats = { ...prev, dragonKills: newKills };
          if (user) update(ref(rtdb, `users/${user.uid}`), { dragonKills: newKills });
          return newStats;
        });
      }
      
      let completedQuestTitle: string | null = null;

      setQuests(prev => {
        let updated = false;
        const newQuests = prev.map(q => {
          if (q.status === 'active' && q.target === monsterType && q.currentCount < q.requiredCount) {
            updated = true;
            const newCount = q.currentCount + 1;
            const isCompleted = newCount >= q.requiredCount;
            if (isCompleted) {
              completedQuestTitle = q.title;
            }
            return { ...q, currentCount: newCount, status: isCompleted ? 'completed' : 'active' };
          }
          return q;
        });
        if (updated && user) {
          update(ref(rtdb, `users/${user.uid}`), { quests: newQuests });
        }
        return newQuests;
      });

      if (completedQuestTitle) {
        window.dispatchEvent(new CustomEvent('local-system-message', { 
          detail: { text: `[퀘스트 완료] ${completedQuestTitle} 조건을 충족했습니다!`, popupOnly: false } 
        }));
      }
    };
    window.addEventListener('monster-killed', handleMonsterKilled);

    const handleItemCollected = (e: any) => {
      const newItem = e.detail;
      setInventory(prev => {
        const existing = prev.find(i => i.id === newItem.id);
        
        // Assign prices based on monster difficulty
        let price = 10;
        if (newItem.id === 'item_slime_jelly') price = 10;
        else if (newItem.id === 'item_wolf_fur') price = 20;
        else if (newItem.id === 'item_goblin_ear') price = 40;
        else if (newItem.id === 'item_orc_tooth') price = 80;
        else if (newItem.id === 'item_ectoplasm') price = 150;
        else if (newItem.id === 'item_dragon_heart') price = 1000;
        else if (newItem.id.includes('potion')) price = 25;
        else if (newItem.id.includes('weapon') || newItem.id.includes('armor')) price = 500;

        const newInv = existing 
          ? prev.map(i => i.id === newItem.id ? { ...i, count: i.count + 1 } : i)
          : [...prev, { ...newItem, count: 1, price }];
        
        // Save to Firebase
        if (user) update(ref(rtdb, `users/${user.uid}`), { inventory: newInv });
        return newInv;
      });
    };
    window.addEventListener('item-collected', handleItemCollected);

    // Save data to Firebase
    const handleSaveData = (e: any) => {
      if (user) {
        update(ref(rtdb, `users/${user.uid}`), e.detail);
      }
    };
    window.addEventListener('save-player-data', handleSaveData);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('player-stats-update', handleStatsUpdate);
      window.removeEventListener('player-death', handleDeath);
      window.removeEventListener('open-shop', handleOpenShop);
      window.removeEventListener('open-blacksmith', handleOpenBlacksmith);
      window.removeEventListener('open-mage-shop', handleOpenMageShop);
      window.removeEventListener('open-hunter-shop', handleOpenHunterShop);
      window.removeEventListener('open-quest', handleOpenQuest);
      window.removeEventListener('open-chief-dialog', handleOpenChiefDialog);
      window.removeEventListener('open-inn-dialog', handleOpenInnDialog);
      window.removeEventListener('open-ghost-dialog', handleOpenGhostDialog);
      window.removeEventListener('monster-killed', handleMonsterKilled);
      window.removeEventListener('item-collected', handleItemCollected);
      window.removeEventListener('save-player-data', handleSaveData);
      destroyGame(game);
    };
  }, [gameState, playerData, user]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreate = async () => {
    if (availablePoints > 0) {
      showToast('스탯 포인트를 모두 분배해야 게임을 시작할 수 있습니다.');
      return;
    }
    if (!nickname.trim()) {
      showToast('닉네임을 입력해주세요.');
      return;
    }
    const newData = {
      nickname,
      level: 1,
      hp: 100,
      maxHp: 100,
      exp: 0,
      maxExp: 100,
      gold: playerData?.gold || 0,
      x: 800,
      y: 800,
      atk,
      def,
      skinColor,
      appearance: 'blue',
      guild: '',
      inventory: []
    };
    try {
      await set(ref(rtdb, `users/${user!.uid}`), newData);
      setPlayerData(newData);
      setStats(newData);
      setGameState('playing');
    } catch (e) {
      console.error("Failed to create character", e);
    }
  };

  const handleGuildChange = (guildName: string) => {
    setStats(prev => ({ ...prev, guild: guildName }));
    setPlayerData(prev => ({ ...prev, guild: guildName }));
    window.dispatchEvent(new CustomEvent('update-player-guild', { detail: { guild: guildName } }));
  };

  const handleUseItem = (id: string) => {
    const item = inventory.find(i => i.id === id);
    if (!item || item.count <= 0) return;

    const lootItems = ['item_slime_jelly', 'item_wolf_fur', 'item_goblin_ear', 'item_orc_tooth', 'item_ectoplasm', 'item_dragon_heart'];
    if (lootItems.includes(id)) {
      showToast('이 아이템은 전리품입니다. 상점에 판매하세요.');
      return;
    }

    let newStats = { ...stats };
    let newInventory = [...inventory];
    let systemMsg = '';
    let popupOnly = false;

    // Helper to unequip and return to local inventory variable
    const unequipInternal = (type: 'weapon' | 'armor') => {
      if (type === 'weapon' && newStats.equippedWeapon) {
        const weaponData: any = {
          'sickle': { id: 'weapon_sickle', name: '낫', atk: 3, price: 300 },
          'sword': { id: 'weapon_sword', name: '철검', atk: 7, price: 800 },
          'mace': { id: 'weapon_mace', name: '철퇴', atk: 12, price: 1500 },
          'chalk': { id: 'weapon_chalk', name: '분필', atk: 4, price: 400 },
          'book': { id: 'weapon_book', name: '마도서', atk: 9, price: 1000 },
          'staff': { id: 'weapon_staff', name: '마법 지팡이', atk: 15, price: 2000 },
          'spear': { id: 'weapon_spear', name: '창', atk: 6, price: 600 },
          'bow': { id: 'weapon_bow', name: '사냥꾼의 활', atk: 10, price: 1100 },
          'shotgun': { id: 'weapon_shotgun', name: '엽총', atk: 18, price: 2500 }
        };
        const old = weaponData[newStats.equippedWeapon];
        if (old) {
          newStats.atk -= old.atk;
          const existing = newInventory.find(i => i.id === old.id);
          if (existing) {
            newInventory = newInventory.map(i => i.id === old.id ? { ...i, count: i.count + 1 } : i);
          } else {
            newInventory.push({ ...old, count: 1 });
          }
        }
        newStats.equippedWeapon = '';
      } else if (type === 'armor' && newStats.equippedArmor) {
        const armorData: any = {
          'shield': { id: 'armor_shield', name: '방패', def: 4, price: 400 },
          'iron': { id: 'armor_iron', name: '철갑옷', def: 10, price: 1200 },
          'fur': { id: 'armor_fur', name: '털가죽 옷', def: 3, price: 300 },
          'leather': { id: 'armor_leather', name: '가죽갑옷', def: 7, price: 700 }
        };
        const old = armorData[newStats.equippedArmor];
        if (old) {
          newStats.def -= old.def;
          const existing = newInventory.find(i => i.id === old.id);
          if (existing) {
            newInventory = newInventory.map(i => i.id === old.id ? { ...i, count: i.count + 1 } : i);
          } else {
            newInventory.push({ ...old, count: 1 });
          }
        }
        newStats.equippedArmor = '';
      }
    };

    // Consume the item first
    newInventory = newInventory.map(i => i.id === id ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0);

    if (id === 'item_potion') {
      newStats.hp = Math.min(stats.maxHp, stats.hp + 50);
      systemMsg = `체력을 50 회복했습니다.`;
    } else if (id === 'item_potion_blue') {
      newStats.mp = Math.min(stats.maxMp, stats.mp + 50);
      systemMsg = `마나를 50 회복했습니다.`;
    } else if (id === 'item_potion_exp') {
      newStats.exp += 50;
      systemMsg = `경험치 물약을 사용했습니다. (EXP +50)`;
      // Level up check
      if (newStats.exp >= newStats.maxExp) {
        newStats.level += 1;
        newStats.exp -= newStats.maxExp;
        newStats.maxExp = Math.floor(newStats.maxExp * 1.5);
        newStats.maxHp += 20;
        newStats.hp = newStats.maxHp;
        newStats.atk += 2;
        newStats.def += 1;
        systemMsg += ` 레벨 업! (Lv.${newStats.level})`;
      }
    } else if (id === 'scroll') {
      systemMsg = `귀환 주문서를 사용했습니다. 마을로 이동합니다.`;
      window.dispatchEvent(new CustomEvent('player-teleport', { detail: { x: 800, y: 800 } }));
    } 
    // Weapons
    else if (id === 'weapon_sickle') { unequipInternal('weapon'); newStats.atk += 3; newStats.equippedWeapon = 'sickle'; systemMsg = '낫을 장착했습니다.'; popupOnly = true; }
    else if (id === 'weapon_sword') { unequipInternal('weapon'); newStats.atk += 7; newStats.equippedWeapon = 'sword'; systemMsg = '철검을 장착했습니다.'; popupOnly = true; }
    else if (id === 'weapon_mace') { unequipInternal('weapon'); newStats.atk += 12; newStats.equippedWeapon = 'mace'; systemMsg = '철퇴를 장착했습니다.'; popupOnly = true; }
    else if (id === 'weapon_chalk') { unequipInternal('weapon'); newStats.atk += 4; newStats.equippedWeapon = 'chalk'; systemMsg = '분필을 장착했습니다.'; popupOnly = true; }
    else if (id === 'weapon_book') { unequipInternal('weapon'); newStats.atk += 9; newStats.equippedWeapon = 'book'; systemMsg = '마도서를 장착했습니다.'; popupOnly = true; }
    else if (id === 'weapon_staff') { unequipInternal('weapon'); newStats.atk += 15; newStats.equippedWeapon = 'staff'; systemMsg = '마법 지팡이를 장착했습니다.'; popupOnly = true; }
    else if (id === 'weapon_spear') { unequipInternal('weapon'); newStats.atk += 6; newStats.equippedWeapon = 'spear'; systemMsg = '창을 장착했습니다.'; popupOnly = true; }
    else if (id === 'weapon_bow') { unequipInternal('weapon'); newStats.atk += 10; newStats.equippedWeapon = 'bow'; systemMsg = '활을 장착했습니다.'; popupOnly = true; }
    else if (id === 'weapon_shotgun') { unequipInternal('weapon'); newStats.atk += 18; newStats.equippedWeapon = 'shotgun'; systemMsg = '엽총을 장착했습니다.'; popupOnly = true; }
    // Armor
    else if (id === 'armor_shield') { unequipInternal('armor'); newStats.def += 4; newStats.equippedArmor = 'shield'; systemMsg = '방패를 장착했습니다.'; }
    else if (id === 'armor_iron') { unequipInternal('armor'); newStats.def += 10; newStats.equippedArmor = 'iron'; systemMsg = '철갑옷을 장착했습니다.'; }
    else if (id === 'armor_fur') { unequipInternal('armor'); newStats.def += 3; newStats.equippedArmor = 'fur'; systemMsg = '털가죽 옷을 장착했습니다.'; }
    else if (id === 'armor_leather') { unequipInternal('armor'); newStats.def += 7; newStats.equippedArmor = 'leather'; systemMsg = '가죽갑옷을 장착했습니다.'; }

    setInventory(newInventory);
    setStats(newStats);
    
    if (systemMsg) {
      window.dispatchEvent(new CustomEvent('local-system-message', { detail: { text: systemMsg, popupOnly } }));
    }
    window.dispatchEvent(new CustomEvent('update-player-stats', { detail: newStats }));
    
    if (user) update(ref(rtdb, `users/${user.uid}`), { 
      inventory: newInventory, 
      hp: newStats.hp, mp: newStats.mp, exp: newStats.exp, level: newStats.level, maxExp: newStats.maxExp, maxHp: newStats.maxHp,
      atk: newStats.atk, def: newStats.def, equippedWeapon: newStats.equippedWeapon, equippedArmor: newStats.equippedArmor 
    });
  };

  const handleUnequipItem = (type: 'weapon' | 'armor') => {
    let newStats = { ...stats };
    let newInventory = [...inventory];
    let itemName = '';

    if (type === 'weapon') {
      if (!stats.equippedWeapon) return;
      const weaponData: any = {
        'sickle': { id: 'weapon_sickle', name: '낫', atk: 3, price: 300 },
        'sword': { id: 'weapon_sword', name: '철검', atk: 7, price: 800 },
        'mace': { id: 'weapon_mace', name: '철퇴', atk: 12, price: 1500 },
        'chalk': { id: 'weapon_chalk', name: '분필', atk: 4, price: 400 },
        'book': { id: 'weapon_book', name: '마도서', atk: 9, price: 1000 },
        'staff': { id: 'weapon_staff', name: '마법 지팡이', atk: 15, price: 2000 },
        'spear': { id: 'weapon_spear', name: '창', atk: 6, price: 600 },
        'bow': { id: 'weapon_bow', name: '활', atk: 10, price: 1100 },
        'shotgun': { id: 'weapon_shotgun', name: '엽총', atk: 18, price: 2500 }
      };
      const old = weaponData[stats.equippedWeapon];
      if (old) {
        newStats.atk -= old.atk;
        itemName = old.name;
        const existing = newInventory.find(i => i.id === old.id);
        if (existing) {
          newInventory = newInventory.map(i => i.id === old.id ? { ...i, count: i.count + 1 } : i);
        } else {
          newInventory.push({ ...old, count: 1 });
        }
      }
      newStats.equippedWeapon = '';
    } else {
      if (!stats.equippedArmor) return;
      const armorData: any = {
        'shield': { id: 'armor_shield', name: '방패', def: 4, price: 400 },
        'iron': { id: 'armor_iron', name: '철갑옷', def: 10, price: 1200 },
        'fur': { id: 'armor_fur', name: '털가죽 옷', def: 3, price: 300 },
        'leather': { id: 'armor_leather', name: '가죽갑옷', def: 7, price: 700 }
      };
      const old = armorData[stats.equippedArmor];
      if (old) {
        newStats.def -= old.def;
        itemName = old.name;
        const existing = newInventory.find(i => i.id === old.id);
        if (existing) {
          newInventory = newInventory.map(i => i.id === old.id ? { ...i, count: i.count + 1 } : i);
        } else {
          newInventory.push({ ...old, count: 1 });
        }
      }
      newStats.equippedArmor = '';
    }

    setStats(newStats);
    setInventory(newInventory);
    window.dispatchEvent(new CustomEvent('update-player-stats', { detail: newStats }));
    if (user) update(ref(rtdb, `users/${user.uid}`), { inventory: newInventory, atk: newStats.atk, def: newStats.def, equippedWeapon: newStats.equippedWeapon, equippedArmor: newStats.equippedArmor });
    window.dispatchEvent(new CustomEvent('local-system-message', { detail: { text: `${itemName}을(를) 해제했습니다.`, popupOnly: true } }));
  };

  const handleBuyItem = (item: any) => {
    if (stats.gold >= item.price) {
      const newGold = stats.gold - item.price;
      setStats(s => ({ ...s, gold: newGold }));
      window.dispatchEvent(new CustomEvent('update-player-stats', { detail: { gold: newGold } }));
      
      setInventory(prev => {
        const existing = prev.find(i => i.id === item.id);
        const newInv = existing 
          ? prev.map(i => i.id === item.id ? { ...i, count: i.count + 1 } : i)
          : [...prev, { ...item, count: 1 }];
        
        if (user) update(ref(rtdb, `users/${user.uid}`), { inventory: newInv, gold: newGold });
        return newInv;
      });
      window.dispatchEvent(new CustomEvent('local-system-message', { detail: { text: `${item.name}을(를) 구매했습니다.` } }));
    }
  };

  const handleSellItem = (item: any) => {
    const sellPrice = Math.floor((item.price || 10) * 0.5);
    const newGold = stats.gold + sellPrice;
    setStats(s => ({ ...s, gold: newGold }));
    window.dispatchEvent(new CustomEvent('update-player-stats', { detail: { gold: newGold } }));
    
    setInventory(prev => {
      const newInv = prev.map(i => i.id === item.id ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0);
      if (user) update(ref(rtdb, `users/${user.uid}`), { inventory: newInv, gold: newGold });
      return newInv;
    });
    window.dispatchEvent(new CustomEvent('local-system-message', { detail: { text: `${item.name}을(를) 판매했습니다. (+${sellPrice}G)` } }));
  };

  const handleSellAll = (item: any) => {
    const count = item.count;
    const sellPrice = Math.floor((item.price || 10) * 0.5) * count;
    const newGold = stats.gold + sellPrice;
    setStats(s => ({ ...s, gold: newGold }));
    window.dispatchEvent(new CustomEvent('update-player-stats', { detail: { gold: newGold } }));
    
    setInventory(prev => {
      const newInv = prev.filter(i => i.id !== item.id);
      if (user) update(ref(rtdb, `users/${user.uid}`), { inventory: newInv, gold: newGold });
      return newInv;
    });
    window.dispatchEvent(new CustomEvent('local-system-message', { detail: { text: `${item.name} ${count}개를 전부 판매했습니다. (+${sellPrice}G)` } }));
  };

  const handleResurrect = () => {
    setIsDead(false);
    const goldLoss = 100;
    const newGold = Math.max(0, stats.gold - goldLoss);
    setStats(s => {
      const newStats = { ...s, hp: s.maxHp, mp: s.maxMp, gold: newGold };
      if (user) update(ref(rtdb, `users/${user.uid}`), { hp: s.maxHp, mp: s.maxMp, gold: newGold });
      return newStats;
    });
    window.dispatchEvent(new CustomEvent('player-resurrect', { detail: { gold: newGold } }));
    window.dispatchEvent(new CustomEvent('local-system-message', { 
      detail: { text: `부활했습니다. (사망 페널티: -${goldLoss}G)`, popupOnly: true } 
    }));
  };

  useEffect(() => {
    if (gameState !== 'playing' || !user) return;

    const activeQuests = quests.filter(q => q.status === 'active');
    const availableQuests = quests.filter(q => q.status === 'available');

    if (activeQuests.length < 3 && availableQuests.length < 3) {
      const generateRandomQuest = () => {
        const targets = [
          { type: 'slime', name: '슬라임', min: 5, max: 15, gold: 10, exp: 5 },
          { type: 'goblin', name: '고블린', min: 3, max: 8, gold: 25, exp: 15 },
          { type: 'wolf', name: '늑대', min: 3, max: 10, gold: 20, exp: 10 },
          { type: 'orc', name: '오크', min: 2, max: 6, gold: 50, exp: 30 },
          { type: 'ghost', name: '망령', min: 1, max: 5, gold: 80, exp: 50 },
        ];
        const target = targets[Math.floor(Math.random() * targets.length)];
        const count = Math.floor(Math.random() * (target.max - target.min + 1)) + target.min;
        const id = 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        
        return {
          id,
          title: `${target.name} 사냥`,
          desc: `${target.name} ${count}마리를 처치하세요.`,
          target: target.type,
          requiredCount: count,
          currentCount: 0,
          rewardGold: count * target.gold,
          rewardExp: count * target.exp,
          status: 'available'
        };
      };

      const newQuest = generateRandomQuest();
      const newQuests = [...quests, newQuest];
      setQuests(newQuests);
      update(ref(rtdb, `users/${user.uid}`), { quests: newQuests });
    }
  }, [quests, gameState, user]);

  if (gameState === 'login') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col items-center justify-center font-pixel text-white overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-7xl text-yellow-500 mb-2 font-bold drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] italic text-center">
            드라곤<br/>
            <span className="ml-12">전설</span>
          </h1>
          <p className="text-gray-400 mb-16 text-lg tracking-[0.5em] text-center">~온라인 RPG~</p>
          
          {!user ? (
            <button 
              onClick={handleLogin} 
              disabled={isLoggingIn}
              className="group relative bg-[#1a1a1a] hover:bg-[#2a2a2a] text-yellow-500 px-12 py-5 border-2 border-[#444] hover:border-yellow-600 rounded-sm text-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 border border-white/5 pointer-events-none" />
              <span className="relative z-10 font-bold tracking-widest">{isLoggingIn ? '로그인 중...' : '구글 계정으로 시작하기'}</span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-600/30 group-hover:bg-yellow-500/50 transition-colors" />
            </button>
          ) : (
            <div className="flex flex-col gap-6 w-72">
              <button 
                onClick={() => {
                  if (playerData) {
                    setGameState('playing');
                  } else {
                    setGameState('creation');
                  }
                }} 
                className="group relative bg-[#1a1a1a] hover:bg-[#2a2a2a] text-yellow-500 px-8 py-5 border-2 border-[#444] hover:border-yellow-600 rounded-sm text-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-hidden"
              >
                <div className="absolute inset-0 border border-white/5 pointer-events-none" />
                <span className="relative z-10 font-bold tracking-widest">플레이</span>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-600/30 group-hover:bg-yellow-500/50 transition-colors" />
              </button>
              
              {playerData && (
                <button 
                  onClick={() => {
                    askConfirm('정말 캐릭터를 삭제하시겠습니까? (모든 데이터가 초기화됩니다)', async () => {
                      await set(ref(rtdb, `users/${user!.uid}`), null);
                      setPlayerData(null);
                      showToast('캐릭터가 삭제되었습니다.');
                    });
                  }} 
                  className="bg-[#111] hover:bg-red-950/30 text-red-500/70 hover:text-red-500 px-8 py-2 border border-[#333] hover:border-red-900 rounded-sm text-xs transition-all active:scale-95 uppercase tracking-tighter"
                >
                  캐릭터 삭제
                </button>
              )}
              
              <button 
                onClick={() => auth.signOut()} 
                className="text-gray-600 hover:text-gray-400 text-[10px] uppercase tracking-widest mt-4 transition-colors"
              >
                [ 로그아웃 ]
              </button>
            </div>
          )}
        </div>

        <button onClick={() => navigate('/')} className="absolute bottom-8 text-gray-700 hover:text-gray-500 underline text-[10px] tracking-tighter">
          메인으로 돌아가기
        </button>

        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center">
            <div className="bg-[#222] p-6 border-2 border-gray-500 rounded text-center">
              <p className="mb-6 text-lg">{confirmText}</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => { confirmAction?.(); setShowConfirm(false); }} className="bg-red-600 px-6 py-2 rounded">확인</button>
                <button onClick={() => setShowConfirm(false)} className="bg-gray-600 px-6 py-2 rounded">취소</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-pixel text-white">
        <div className="text-red-500 text-3xl mb-4 font-bold">오류 발생!</div>
        <div className="text-gray-300 mb-8 text-center max-w-md break-words bg-[#222] p-4 rounded border border-gray-600">
          {errorMsg}
        </div>
        <div className="text-yellow-400 mb-8 text-center max-w-md text-sm leading-relaxed">
          <p>Firebase Realtime Database가 활성화되지 않았거나</p>
          <p>보안 규칙(Rules)이 설정되지 않아 발생한 문제입니다.</p>
          <p className="mt-2 text-gray-400">Firebase 콘솔에서 Realtime Database를 생성하고 규칙을 수정해주세요.</p>
        </div>
        <button 
          onClick={() => {
            auth.signOut();
            setGameState('login');
          }} 
          className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded border-2 border-gray-500 transition-colors"
        >
          로그아웃 및 돌아가기
        </button>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-pixel text-white">
        <div className="text-2xl animate-pulse">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (gameState === 'main_menu') {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-pixel text-white">
        <div className="bg-[#222] p-8 border-4 border-gray-500 rounded-lg w-[400px] shadow-2xl text-center">
          <h2 className="text-3xl text-yellow-400 mb-8 font-bold">캐릭터 선택</h2>
          <div className="mb-8 bg-black/50 p-4 rounded border border-gray-700 text-left">
            <p className="text-xl text-white mb-2">닉네임: <span className="text-yellow-400">{playerData.nickname}</span></p>
            <p className="text-gray-300">레벨: {playerData.level}</p>
            <p className="text-gray-300">골드: {playerData.gold} G</p>
          </div>
          <button 
            onClick={() => setGameState('playing')} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 border-2 border-blue-400 rounded text-lg font-bold transition-colors active:scale-95 mb-4"
          >
            게임 시작
          </button>
          <button 
            onClick={() => {
              askConfirm('정말 캐릭터를 삭제하시겠습니까? (모든 데이터가 초기화됩니다)', async () => {
                await set(ref(rtdb, `users/${user!.uid}`), null);
                window.location.href = '/';
              });
            }} 
            className="w-full bg-red-900 hover:bg-red-800 text-white py-3 border-2 border-red-700 rounded text-lg font-bold transition-colors active:scale-95"
          >
            캐릭터 삭제
          </button>
        </div>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center">
            <div className="bg-[#222] p-6 border-2 border-gray-500 rounded text-center">
              <p className="mb-6 text-lg">{confirmText}</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => { confirmAction?.(); setShowConfirm(false); }} className="bg-red-600 px-6 py-2 rounded">확인</button>
                <button onClick={() => setShowConfirm(false)} className="bg-gray-600 px-6 py-2 rounded">취소</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'creation') {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-pixel text-white">
        <div className="bg-[#222] p-8 border-4 border-gray-500 rounded-lg w-[400px] shadow-2xl">
          <h2 className="text-3xl text-center text-yellow-400 mb-8 font-bold">캐릭터 생성</h2>
          
          <div className="mb-6">
            <label className="block mb-2 text-gray-300">닉네임</label>
            <input 
              type="text" 
              value={nickname} 
              onChange={e => setNickname(e.target.value)} 
              className="w-full bg-black border-2 border-gray-600 px-3 py-2 text-white outline-none focus:border-yellow-400 transition-colors" 
              maxLength={12}
            />
          </div>

          <div className="mb-6 bg-black/50 p-4 rounded border border-gray-700">
            <label className="block mb-4 text-center text-gray-300">
              잔여 스탯 포인트: <span className="text-yellow-400 text-xl">{availablePoints}</span>
            </label>
            <div className="flex justify-between items-center mb-4">
              <span className="text-red-400 font-bold">공격력 (ATK): {atk}</span>
              <div className="flex gap-2">
                <button onClick={() => atk > 0 && setAtk(a => a - 1)} className="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded border border-gray-500 flex items-center justify-center">-</button>
                <button onClick={() => availablePoints > 0 && setAtk(a => a + 1)} className="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded border border-gray-500 flex items-center justify-center">+</button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-400 font-bold">방어력 (DEF): {def}</span>
              <div className="flex gap-2">
                <button onClick={() => def > 0 && setDef(d => d - 1)} className="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded border border-gray-500 flex items-center justify-center">-</button>
                <button onClick={() => availablePoints > 0 && setDef(d => d + 1)} className="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded border border-gray-500 flex items-center justify-center">+</button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block mb-3 text-center text-gray-300">피부색 선택</label>
            <div className="flex justify-center gap-4 flex-wrap">
              <button onClick={() => setSkinColor('#ffffff')} className={`w-12 h-12 bg-[#ffffff] rounded ${skinColor === '#ffffff' ? 'border-4 border-yellow-400 scale-110' : 'border-2 border-gray-600'} transition-all`}></button>
              <button onClick={() => setSkinColor('#aaffaa')} className={`w-12 h-12 bg-[#aaffaa] rounded ${skinColor === '#aaffaa' ? 'border-4 border-yellow-400 scale-110' : 'border-2 border-gray-600'} transition-all`}></button>
              <button onClick={() => setSkinColor('#aaaaff')} className={`w-12 h-12 bg-[#aaaaff] rounded ${skinColor === '#aaaaff' ? 'border-4 border-yellow-400 scale-110' : 'border-2 border-gray-600'} transition-all`}></button>
              <button onClick={() => setSkinColor('#ffaaaa')} className={`w-12 h-12 bg-[#ffaaaa] rounded ${skinColor === '#ffaaaa' ? 'border-4 border-yellow-400 scale-110' : 'border-2 border-gray-600'} transition-all`}></button>
              <button onClick={() => setSkinColor('#ffccaa')} className={`w-12 h-12 bg-[#ffccaa] rounded ${skinColor === '#ffccaa' ? 'border-4 border-yellow-400 scale-110' : 'border-2 border-gray-600'} transition-all`}></button>
              <button onClick={() => setSkinColor('#ffbb99')} className={`w-12 h-12 bg-[#ffbb99] rounded ${skinColor === '#ffbb99' ? 'border-4 border-yellow-400 scale-110' : 'border-2 border-gray-600'} transition-all`}></button>
              <button onClick={() => setSkinColor('#eebb88')} className={`w-12 h-12 bg-[#eebb88] rounded ${skinColor === '#eebb88' ? 'border-4 border-yellow-400 scale-110' : 'border-2 border-gray-600'} transition-all`}></button>
              <button onClick={() => setSkinColor('#ccaa77')} className={`w-12 h-12 bg-[#ccaa77] rounded ${skinColor === '#ccaa77' ? 'border-4 border-yellow-400 scale-110' : 'border-2 border-gray-600'} transition-all`}></button>
            </div>
          </div>

          <button 
            onClick={handleCreate} 
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-3 border-2 border-yellow-400 rounded text-lg font-bold transition-colors active:scale-95"
          >
            게임 시작
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col font-pixel text-white">
      {/* Top UI Layer */}
      <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-start z-10 pointer-events-none">
        
        {/* Left Side: Exit Button + HUD */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button 
              onClick={() => setGameState('login')}
              className="pointer-events-auto bg-[#2b2b2b] text-[#d4c4a8] border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] border-2 px-3 py-1.5 text-xs sm:text-sm hover:bg-[#3a3a3a] active:border-t-[#111] active:border-l-[#111] active:border-b-[#555] active:border-r-[#555] flex items-center gap-1 transition-none w-fit"
            >
              <X size={14} /> 나가기
            </button>
            <button 
              onClick={() => { setRankingOpen(!isRankingOpen); setActiveWindow('ranking'); }}
              className="pointer-events-auto bg-[#2b2b2b] text-[#d4c4a8] border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] border-2 px-3 py-1.5 text-xs sm:text-sm hover:bg-[#3a3a3a] active:border-t-[#111] active:border-l-[#111] active:border-b-[#555] active:border-r-[#555] flex items-center gap-1 transition-none w-fit"
            >
              순위
            </button>
          </div>
          
          {/* HUD (Heads Up Display) */}
          <div className="pointer-events-none bg-black/50 p-2 sm:p-3 border-2 border-[#444] min-w-[180px] sm:min-w-[200px] backdrop-blur-sm">
            <div className="text-yellow-400 text-sm mb-2 font-bold">
              {stats.guild && <span className={`${stats.isGuildLeader ? 'text-red-500' : 'text-yellow-400'} mr-1`}>&lt;{stats.guild}&gt;</span>}
              Lv.{stats.level} {stats.nickname || '플레이어'}
            </div>
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className="text-yellow-400 w-8">GOLD</span>
              <span className="flex-1 text-right">{stats.gold} G</span>
            </div>
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className="text-red-400 w-8">HP</span>
              <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden border border-gray-700">
                <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }} />
              </div>
              <span className="w-12 text-right">{stats.hp}/{stats.maxHp}</span>
            </div>
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className="text-blue-400 w-8">MP</span>
              <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden border border-gray-700">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(stats.mp / stats.maxMp) * 100}%` }} />
              </div>
              <span className="w-12 text-right">{stats.mp}/{stats.maxMp}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400 w-8">EXP</span>
              <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden border border-gray-700">
                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${(stats.exp / stats.maxExp) * 100}%` }} />
              </div>
              <span className="w-12 text-right">{Math.floor((stats.exp / stats.maxExp) * 100)}%</span>
            </div>
          </div>
        </div>
        
        {/* Right Side: Menu Buttons + Minimap Controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex flex-wrap gap-1 sm:gap-2 justify-end">
            <button 
              onClick={() => { setInventoryOpen(!isInventoryOpen); setActiveWindow('inventory'); }}
              className="bg-[#2b2b2b] text-[#d4c4a8] border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] border-2 px-3 py-1.5 text-xs sm:text-sm hover:bg-[#3a3a3a] active:border-t-[#111] active:border-l-[#111] active:border-b-[#555] active:border-r-[#555] transition-none"
            >
              가방 (I)
            </button>
            <button 
              onClick={() => { setEquipmentOpen(!isEquipmentOpen); setActiveWindow('equipment'); }}
              className="bg-[#2b2b2b] text-[#d4c4a8] border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] border-2 px-3 py-1.5 text-xs sm:text-sm hover:bg-[#3a3a3a] active:border-t-[#111] active:border-l-[#111] active:border-b-[#555] active:border-r-[#555] transition-none"
            >
              장비 (E)
            </button>
            <button 
              onClick={() => { setGuildOpen(!isGuildOpen); setActiveWindow('guild'); }}
              className="bg-[#2b2b2b] text-[#d4c4a8] border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] border-2 px-3 py-1.5 text-xs sm:text-sm hover:bg-[#3a3a3a] active:border-t-[#111] active:border-l-[#111] active:border-b-[#555] active:border-r-[#555] transition-none"
            >
              길드 (G)
            </button>
            <button 
              onClick={() => { setQuestOpen(!isQuestOpen); setActiveWindow('quest'); }}
              className="bg-[#2b2b2b] text-[#d4c4a8] border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] border-2 px-3 py-1.5 text-xs sm:text-sm hover:bg-[#3a3a3a] active:border-t-[#111] active:border-l-[#111] active:border-b-[#555] active:border-r-[#555] transition-none"
            >
              퀘스트 (Q)
            </button>
          </div>

          {/* Minimap Controls */}
          <div className="pointer-events-auto flex gap-1">
            <button 
              onClick={() => {
                const newVisible = !isMinimapOpen;
                setMinimapOpen(newVisible);
                window.dispatchEvent(new CustomEvent('toggle-minimap', { detail: { visible: newVisible } }));
              }}
              className="bg-[#2b2b2b] text-[#d4c4a8] border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] border-2 px-2 py-1 text-[10px] hover:bg-[#3a3a3a]"
            >
              {isMinimapOpen ? '미니맵 닫기' : '미니맵 열기'}
            </button>
          </div>
        </div>
      </div>

      {/* Phaser Game Container */}
      <div ref={gameContainerRef} className="w-full h-full" id="phaser-game" />

      {/* Draggable UIs */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
        {isInventoryOpen && (
          <div className="pointer-events-auto absolute" style={{ zIndex: activeWindow === 'inventory' ? 30 : 20 }} onMouseDown={() => setActiveWindow('inventory')}>
            <Inventory onClose={() => setInventoryOpen(false)} items={inventory} onUseItem={handleUseItem} />
          </div>
        )}
        {isEquipmentOpen && (
          <div className="pointer-events-auto absolute" style={{ zIndex: activeWindow === 'equipment' ? 30 : 20 }} onMouseDown={() => setActiveWindow('equipment')}>
            <Equipment onClose={() => setEquipmentOpen(false)} stats={stats} onUnequip={handleUnequipItem} />
          </div>
        )}
        {isGuildOpen && (
          <div className="pointer-events-auto absolute" style={{ zIndex: activeWindow === 'guild' ? 30 : 20 }} onMouseDown={() => setActiveWindow('guild')}>
            <GuildWindow onClose={() => setGuildOpen(false)} user={user} stats={stats} onGuildChange={handleGuildChange} showToast={showToast} />
          </div>
        )}
        {isRankingOpen && (
          <div className="pointer-events-auto absolute" style={{ zIndex: activeWindow === 'ranking' ? 30 : 20 }} onMouseDown={() => setActiveWindow('ranking')}>
            <DraggableWindow title="순위" onClose={() => setRankingOpen(false)}>
              <div className="w-48 p-2">
                {ranking.map((user, index) => (
                  <div key={user.nickname} className="flex justify-between py-1 border-b border-[#444]">
                    <span>{index + 1}위 {user.nickname}</span>
                    <span>Lv.{user.level}</span>
                  </div>
                ))}
              </div>
            </DraggableWindow>
          </div>
        )}
        {isShopOpen && (
          <div className="pointer-events-auto absolute" style={{ zIndex: activeWindow === 'shop' ? 30 : 20 }} onMouseDown={() => setActiveWindow('shop')}>
            <ShopWindow onClose={() => setShopOpen(false)} playerGold={stats.gold} onBuy={handleBuyItem} onSell={handleSellItem} onSellAll={handleSellAll} inventory={inventory} />
          </div>
        )}
        {isBlacksmithOpen && (
          <div className="pointer-events-auto absolute" style={{ zIndex: activeWindow === 'blacksmith' ? 30 : 20 }} onMouseDown={() => setActiveWindow('blacksmith')}>
            <ShopWindow onClose={() => setBlacksmithOpen(false)} playerGold={stats.gold} onBuy={handleBuyItem} onSell={handleSellItem} onSellAll={handleSellAll} inventory={inventory} shopType="blacksmith" />
          </div>
        )}
        {isMageShopOpen && (
          <div className="pointer-events-auto absolute" style={{ zIndex: activeWindow === 'mageShop' ? 30 : 20 }} onMouseDown={() => setActiveWindow('mageShop')}>
            <ShopWindow onClose={() => setMageShopOpen(false)} playerGold={stats.gold} onBuy={handleBuyItem} onSell={handleSellItem} onSellAll={handleSellAll} inventory={inventory} shopType="mage" />
          </div>
        )}
        {isHunterShopOpen && (
          <div className="pointer-events-auto absolute" style={{ zIndex: activeWindow === 'hunterShop' ? 30 : 20 }} onMouseDown={() => setActiveWindow('hunterShop')}>
            <ShopWindow onClose={() => setHunterShopOpen(false)} playerGold={stats.gold} onBuy={handleBuyItem} onSell={handleSellItem} onSellAll={handleSellAll} inventory={inventory} shopType="hunter" />
          </div>
        )}
        {isQuestOpen && (
          <div className="pointer-events-auto absolute" style={{ zIndex: activeWindow === 'quest' ? 30 : 20 }} onMouseDown={() => setActiveWindow('quest')}>
            <QuestWindow 
              onClose={() => setQuestOpen(false)} 
              quests={quests} 
              onAcceptQuest={(id) => {
                const newQuests = quests.map(q => q.id === id ? { ...q, status: 'active' } : q);
                setQuests(newQuests);
                if (user) update(ref(rtdb, `users/${user.uid}`), { quests: newQuests });
                window.dispatchEvent(new CustomEvent('local-system-message', { detail: { text: '퀘스트를 수락했습니다.', popupOnly: true } }));
              }}
              onCompleteQuest={(id) => {
                const quest = quests.find(q => q.id === id);
                if (!quest) return;
                
                const newExp = stats.exp + quest.rewardExp;
                const newGold = stats.gold + quest.rewardGold;
                const newStats = { ...stats, exp: newExp, gold: newGold };
                setStats(newStats);
                if (user) update(ref(rtdb, `users/${user.uid}`), newStats);
                window.dispatchEvent(new CustomEvent('update-player-stats', { detail: { exp: newExp, gold: newGold } }));
                
                const newQuests = quests.map(q => q.id === id ? { ...q, status: 'rewarded' } : q);
                setQuests(newQuests);
                if (user) update(ref(rtdb, `users/${user.uid}`), { quests: newQuests });
                window.dispatchEvent(new CustomEvent('local-system-message', { detail: { text: `퀘스트 보상: ${quest.rewardGold}G, ${quest.rewardExp}EXP`, popupOnly: true } }));
              }}
            />
          </div>
        )}

        {/* Minimap Window Mode - Removed as per user request */}

        {/* Chief Dialogue Window */}
        {isChiefDialogOpen && (
          <DraggableWindow title="마을 촌장" onClose={() => setChiefDialogOpen(false)}>
            <div className="flex flex-col gap-4 min-w-[300px]">
              <div className="bg-black/40 p-3 rounded border border-gray-700 min-h-[80px]">
                {chiefDialogue}
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setChiefDialogue('남서쪽은 망령구역, 남쪽은 고블린 구역, 동남쪽은 오크와 드래곤, 북동쪽은 늑대 구역이라네. 특히 드래곤 구역은 아주 위험하니 조심하게!')}
                  className="text-left p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-sm"
                >
                  "몬스터 구역에 대해 알려주세요"
                </button>
                <button 
                  onClick={() => setChiefDialogue('허허, 든든하구만. 마을에 가끔 들러서 쉬다 가게나.')}
                  className="text-left p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-sm"
                >
                  "걱정 마세요 촌장님."
                </button>
                {stats.dragonKills > 0 && (
                  <button 
                    onClick={() => setChiefDialogue('정말 고맙네! 자네는 최고의 영웅이야! (어차피 드래곤은 조금 있다가 다시 부활하지만.)')}
                    className="text-left p-2 bg-yellow-900/30 hover:bg-yellow-900/50 rounded border border-yellow-700 text-sm text-yellow-200"
                  >
                    "촌장님 이제 걱정 마세요, 드래곤은 없어요."
                  </button>
                )}
                <button 
                  onClick={() => {
                    setChiefDialogue('뭐라고? 참 싸가지가 없구만! 당장 마을에서 나가게!');
                    setTimeout(() => setChiefDialogOpen(false), 2000);
                  }}
                  className="text-left p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-sm"
                >
                  "신경 끄세요 좀"
                </button>
              </div>
            </div>
          </DraggableWindow>
        )}

        {/* Inn Dialogue Window */}
        {isInnDialogOpen && (
          <DraggableWindow title="여관" onClose={() => setInnDialogOpen(false)}>
            <div className="flex flex-col gap-4 min-w-[250px] text-center">
              <p>여관에서 쉬어가시겠습니까?</p>
              <p className="text-yellow-400 text-sm">(비용: 50 G / 체력과 마나 완전 회복)</p>
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => {
                    if (stats.gold >= 50) {
                      const newGold = stats.gold - 50;
                      const newStats = { ...stats, gold: newGold, hp: stats.maxHp, mp: stats.maxMp };
                      setStats(newStats);
                      if (user) update(ref(rtdb, `users/${user.uid}`), newStats);
                      window.dispatchEvent(new CustomEvent('update-player-stats', { detail: newStats }));
                      window.dispatchEvent(new CustomEvent('local-system-message', { detail: { text: '여관에서 푹 쉬었습니다. 체력과 마나가 회복되었습니다.', popupOnly: true } }));
                      setInnDialogOpen(false);
                    } else {
                      showToast('골드가 부족합니다.');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold"
                >
                  휴식하기
                </button>
                <button onClick={() => setInnDialogOpen(false)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded">
                  취소
                </button>
              </div>
            </div>
          </DraggableWindow>
        )}

        {/* Ghost Dialogue Window */}
        {isGhostDialogOpen && (
          <DraggableWindow title="지박령" onClose={() => setGhostDialogOpen(false)}>
            <div className="flex flex-col gap-4 min-w-[300px]">
              <div className="bg-black/40 p-3 rounded border border-gray-700 min-h-[80px]">
                {ghostDialogue}
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setGhostDialogue('드래곤 때문에 망해버린 마을에서 벗어나지 못하는 지박령이다.')}
                  className="text-left p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-sm"
                >
                  "누구세요?"
                </button>
                <button 
                  onClick={() => setGhostDialogue('불만있냐?')}
                  className="text-left p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-sm"
                >
                  "귀신이다!"
                </button>
                {stats.dragonKills > 0 && (
                  <button 
                    onClick={() => setGhostDialogue('고마워, 넌 마을 사람들의 영웅이야! (나 죽기 전에 죽였어야지, 쯧.)')}
                    className="text-left p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-sm text-yellow-400"
                  >
                    "내가 드래곤을 죽였어요!"
                  </button>
                )}
                <button 
                  onClick={() => {
                    setGhostDialogue('흥, 나도 관심 없거든.');
                    setTimeout(() => setGhostDialogOpen(false), 2000);
                  }}
                  className="text-left p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-sm"
                >
                  "(무시한다.)"
                </button>
              </div>
            </div>
          </DraggableWindow>
        )}
      </div>
      
      {/* Death Screen */}
      {isDead && (
        <div className="absolute inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
          <h1 className="text-6xl text-red-600 font-bold mb-8 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">사망했습니다</h1>
          <button 
            onClick={handleResurrect}
            className="bg-[#2b2b2b] text-[#d4c4a8] border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] border-4 px-8 py-4 text-2xl hover:bg-[#3a3a3a] active:border-t-[#111] active:border-l-[#111] active:border-b-[#555] active:border-r-[#555] transition-none"
          >
            마을에서 부활하기
          </button>
        </div>
      )}

      {/* Toast Message */}
      {toastMsg && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded border border-gray-600 z-[150] pointer-events-none animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center pointer-events-auto">
          <div className="bg-[#222] p-6 border-2 border-gray-500 rounded text-center">
            <p className="mb-6 text-lg">{confirmText}</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => { confirmAction?.(); setShowConfirm(false); }} className="bg-red-600 px-6 py-2 rounded">확인</button>
              <button onClick={() => setShowConfirm(false)} className="bg-gray-600 px-6 py-2 rounded">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat UI at bottom */}
      <Chat user={user} nickname={stats.nickname} />
    </div>
  );
};

// Simple Guild Window Component
const GuildWindow = ({ onClose, user, stats, onGuildChange, showToast }: { onClose: () => void, user: User | null, stats: any, onGuildChange: (g: string) => void, showToast: (msg: string) => void }) => {
  const [guildName, setGuildName] = useState('');
  const [loading, setLoading] = useState(false);
  const [guildList, setGuildList] = useState<any[]>([]);

  useEffect(() => {
    const fetchGuilds = async () => {
      const snap = await get(ref(rtdb, 'guilds'));
      if (snap.exists()) {
        setGuildList(Object.values(snap.val()));
      } else {
        setGuildList([]);
      }
    };
    fetchGuilds();
  }, [stats.guild]);

  const handleCreateGuild = async () => {
    if (!guildName.trim()) return;
    setLoading(true);
    try {
      const guildRef = ref(rtdb, `guilds/${guildName}`);
      const snap = await get(guildRef);
      if (snap.exists()) {
        showToast('이미 존재하는 길드 이름입니다.');
        setLoading(false);
        return;
      }
      
      await set(guildRef, { name: guildName, leader: user?.uid });
      await update(ref(rtdb, `users/${user?.uid}`), { guild: guildName });
      showToast(`'${guildName}' 길드를 창설하고 가입했습니다!`);
      setGuildName('');
      onGuildChange(guildName);
    } catch (e) {
      console.error(e);
      showToast('길드 생성 실패');
    }
    setLoading(false);
  };

  const handleJoinGuild = async (targetGuild: string) => {
    setLoading(true);
    try {
      await update(ref(rtdb, `users/${user?.uid}`), { guild: targetGuild });
      showToast(`'${targetGuild}' 길드에 가입했습니다!`);
      onGuildChange(targetGuild);
    } catch (e) {
      console.error(e);
      showToast('길드 가입 실패');
    }
    setLoading(false);
  };

  const handleLeaveGuild = async () => {
    setLoading(true);
    try {
      const currentGuild = stats.guild;
      await update(ref(rtdb, `users/${user?.uid}`), { guild: '' });
      
      const usersSnap = await get(ref(rtdb, 'users'));
      let otherMemberUid = null;
      if (usersSnap.exists()) {
        const users = usersSnap.val();
        for (const [uid, uData] of Object.entries(users)) {
          if ((uData as any).guild === currentGuild && uid !== user?.uid) {
            otherMemberUid = uid;
            break;
          }
        }
      }
      
      const guildRef = ref(rtdb, `guilds/${currentGuild}`);
      const guildSnap = await get(guildRef);
      if (guildSnap.exists()) {
        const guildData = guildSnap.val();
        if (guildData.leader === user?.uid) {
          if (otherMemberUid) {
            await update(guildRef, { leader: otherMemberUid });
          } else {
            await set(guildRef, null);
          }
        }
      }
      
      showToast('길드를 탈퇴했습니다.');
      onGuildChange('');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <DraggableWindow title="길드 시스템" onClose={onClose}>
      <div className="w-full sm:w-64 text-[#d4c4a8]">
        {stats.guild ? (
          <div className="text-center py-2">
            <p className="text-gray-400 text-xs mb-2">현재 소속 길드</p>
            <p className="text-xl text-green-400 font-bold mb-6">&lt;{stats.guild}&gt;</p>
            <button 
              onClick={handleLeaveGuild}
              disabled={loading}
              className="bg-[#3b1a1a] hover:bg-[#4a2a2a] text-[#d4c4a8] px-4 py-2 border-t-[#663333] border-l-[#663333] border-b-[#111] border-r-[#111] border-2 w-full transition-none active:border-t-[#111] active:border-l-[#111] active:border-b-[#663333] active:border-r-[#663333]"
            >
              길드 탈퇴
            </button>
          </div>
        ) : (
          <div className="py-2 flex flex-col gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-2">기존 길드 가입</p>
              <div className="bg-[#111] border-t-[#111] border-l-[#111] border-b-[#555] border-r-[#555] border-2 p-2 max-h-32 overflow-y-auto">
                {guildList.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">생성된 길드가 없습니다.</p>
                ) : (
                  guildList.map(g => (
                    <div key={g.name} className="flex justify-between items-center mb-2 last:mb-0">
                      <span className="text-sm text-yellow-500">{g.name}</span>
                      <button 
                        onClick={() => handleJoinGuild(g.name)}
                        disabled={loading}
                        className="bg-[#1a2b3c] hover:bg-[#2a3b4c] text-xs px-2 py-1 border-t-[#335577] border-l-[#335577] border-b-[#111] border-r-[#111] border-2 transition-none active:border-t-[#111] active:border-l-[#111] active:border-b-[#335577] active:border-r-[#335577]"
                      >
                        가입
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-[#444] pt-4">
              <p className="text-gray-400 text-xs mb-2">새로운 길드 창설</p>
              <input 
                type="text" 
                value={guildName}
                onChange={(e) => setGuildName(e.target.value)}
                placeholder="길드 이름 입력"
                className="w-full bg-black border border-[#555] px-3 py-2 text-white mb-2 outline-none focus:border-[#d4c4a8] text-sm"
                maxLength={8}
              />
              <button 
                onClick={handleCreateGuild}
                disabled={loading || !guildName.trim()}
                className="bg-[#1a2b3c] hover:bg-[#2a3b4c] text-[#d4c4a8] px-4 py-2 border-t-[#335577] border-l-[#335577] border-b-[#111] border-r-[#111] border-2 w-full transition-none disabled:opacity-50 active:border-t-[#111] active:border-l-[#111] active:border-b-[#335577] active:border-r-[#335577]"
              >
                길드 창설
              </button>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};

export default RPGPage;
