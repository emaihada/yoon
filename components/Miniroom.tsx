import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Save, Lock } from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RoomItem, BackgroundConfig } from '../types';

const DEFAULT_BG: BackgroundConfig = {
  wallColor: '#d1d5db',
  floorColor: '#e5e7eb',
  floorPattern: 'dots',
  windowType: 'day'
};

const BG_STORAGE_KEY = 'miniroom_bg_v1';
const WALL_COLORS = ['#ffffff', '#f3f4f6', '#d1d5db', '#fce7f3', '#dbeafe', '#dcfce3', '#fef9c3', '#ffedd5', '#e0e7ff', '#fae8ff'];
const FLOOR_COLORS = ['#ffffff', '#e5e7eb', '#d1d5db', '#deb887', '#d2b48c', '#8b4513', '#cbd5e1', '#a7f3d0', '#fecaca', '#fde047'];

const EMOJI_CATEGORIES = [
  {
    name: '표정 및 사람',
    emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏']
  },
  {
    name: '동물 및 자연',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷','🕸','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🐚','🪨','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐️','🌟','✨','⚡️','☄️','💥','🔥','🌪','🌈','☀️','🌤','⛅️','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄️','🌬','💨','💧','💦','☔️','☂️','🌊','🌫']
  },
  {
    name: '음식 및 음료',
    emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕️','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽','🥣','🥡','🥢','🧂']
  },
  {
    name: '활동 및 스포츠',
    emojis: ['⚽️','🏀','🏈','⚾️','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳️','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋️‍♀️','🏋️','🏋️‍♂️','🤼‍♀️','🤼','🤼‍♂️','🤸‍♀️','🤸','🤸‍♂️','⛹️‍♀️','⛹️','⛹️‍♂️','🤺','🤾‍♀️','🤾','🤾‍♂️','🏌️‍♀️','🏌️','🏌️‍♂️','🏇','🧘‍♀️','🧘','🧘‍♂️','🏄‍♀️','🏄','🏄‍♂️','🏊‍♀️','🏊','🏊‍♂️','🤽‍♀️','🤽','🤽‍♂️','🚣‍♀️','🚣','🚣‍♂️','🧗‍♀️','🧗','🧗‍♂️','🚵‍♀️','🚵','🚵‍♂️','🚴‍♀️','🚴','🚴‍♂️','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎗','🎫','🎟','🎪','🤹','🤹‍♂️','🤹‍♀️','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩']
  },
  {
    name: '여행 및 장소',
    emojis: ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩','💺','🛰','🚀','🛸','🚁','🛶','⛵️','🚤','🛥','🛳','⛴','🚢','⚓️','🪝','⛽️','🚧','🚦','🚥','🚏','🗺','🗿','🗽','🗼','🏰','🏯','🏟','🎡','🎢','🎠','⛲️','⛱','🏖','🏝','🏜','🌋','⛰','🏔','🗻','🏕','⛺️','🛖','🏠','🏡','🏘','🏚','🏗','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛','⛪️','🕌','🕍','🛕','🕋','⛩','🛤','🛣','🗾','🎑','🏞','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙','🌃','🌌','🌉','🌁']
  },
  {
    name: '사물',
    emojis: ['⌚️','📱','📲','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌛️','⏳','📡','🔋','🔌','💡','🔦','🕯','🪔','🧯','🛢','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒','🛠','⛏','🪚','🔩','⚙️','🪤','🧱','⛓','🧲','🔫','💣','🧨','🪓','🔪','🗡','⚔️','🛡','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡','🧹','🪠','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣','🧴','🛎','🔑','🗝','🚪','🪑','🛋','🛏','🛌','🧸','🪆','🖼','🪞','🪟','🛍','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐','✉️','📩','📨','📧','💌','📥','📤','📦','🏷','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒','🗓','📆','📅','🗑','📇','🗃','🗳','🗄','📋','📁','📂','🗂','🗞','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇','📐','📏','🧮','📌','📍','✂️','🖊','🖋','✒️','🖌','🖍','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓']
  },
  {
    name: '기호',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈️','♉️','♊️','♋️','♌️','♍️','♎️','♏️','♐️','♑️','♒️','♓️','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚️','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕️','🛑','⛔️','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗️','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯️','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿️','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸','⏯','⏹','⏺','⏭','⏮','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','♾','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫️','⚪️','🟤','🔺','🔻','🔸','🔹','🔶','🟦','🟪','⬛️','⬜️','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','👁‍🗨','💬','💭','🗯','♠️','♣️','♥️','♦️','🃏','🎴','🀄️','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛','🕜','🕝','🕞','🕟','🕠','🕡','🕢','🕣','🕤','🕥','🕦','🕧']
  },
  {
    name: '의류 및 악세서리',
    emojis: ['👕','👖','👔','👗','👙','👘','🥻','🩱','🩲','🩳','💄','💋','👣','🧦','🥾','🥿','👟','👞','👢','👡','👠','🩴','🧢','👒','🎩','🎓','👑','⛑','🪖','🎒','👝','👛','👜','💼','👓','🕶','🥽','🧣','🧤','💍','🌂','☂️']
  },
  {
    name: '국기',
    emojis: ['🇰🇷','🇺🇸','🇬🇧','🇯🇵','🇨🇳','🇩🇪','🇫🇷','🇮🇹','🇪🇸','🇨🇦','🇦🇺','🇷🇺','🇧🇷','🇮🇳','🏳️‍🌈','🏳️‍⚧️','🏁','🚩','🎌','🏴','🏳️','🏴‍☠️','🇦🇷','🇲🇽','🇻🇳','🇹🇭','🇵🇭','🇮🇩','🇲🇾','🇸🇬']
  }
];

const STORAGE_KEY = 'miniroom_layout_v3';

interface MiniroomProps {
  isEditable?: boolean;
  isAddingItem?: boolean;
  onCloseAdding?: () => void;
  isEditingBg?: boolean;
  onCloseBg?: () => void;
  resetTrigger?: number;
}

const Miniroom: React.FC<MiniroomProps> = ({ isEditable = false, isAddingItem = false, onCloseAdding, isEditingBg = false, onCloseBg, resetTrigger = 0 }) => {
  const [items, setItems] = useState<RoomItem[]>([]);
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>(DEFAULT_BG);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const roomRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const loadAndSubscribe = async () => {
      const docRef = doc(db, 'miniroom', 'layout');
      
      if (isEditable) {
        // Owner: fetch once
        try {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.items) setItems(data.items);
            if (data.bgConfig) setBgConfig(data.bgConfig);
          } else {
            // Fallback to localStorage if Firebase is empty
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              try { setItems(JSON.parse(saved)); } catch (e) {}
            }
            const savedBg = localStorage.getItem(BG_STORAGE_KEY);
            if (savedBg) {
              try { setBgConfig(JSON.parse(savedBg)); } catch (e) {}
            }
          }
        } catch (e) {
          console.error("Failed to load miniroom", e);
        }
        setIsLoaded(true);
      } else {
        // Guest: subscribe to real-time updates
        unsubscribe = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.items) setItems(data.items);
            if (data.bgConfig) setBgConfig(data.bgConfig);
          }
          setIsLoaded(true);
        });
      }
    };

    loadAndSubscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isEditable]);

  useEffect(() => {
    if (isEditable && isLoaded) {
      const timeoutId = setTimeout(() => {
        const docRef = doc(db, 'miniroom', 'layout');
        setDoc(docRef, { items, bgConfig, updatedAt: Date.now() }).catch(console.error);
        
        // Also save to localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(bgConfig));
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [items, bgConfig, isEditable, isLoaded]);

  useEffect(() => {
    if (resetTrigger > 0 && isEditable) {
      setItems([]);
      setSelectedId(null);
      const docRef = doc(db, 'miniroom', 'layout');
      setDoc(docRef, { items: [], bgConfig, updatedAt: Date.now() }).catch(console.error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [resetTrigger, isEditable]);

  const handleAddItem = (emoji: string) => {
    const newItem: RoomItem = {
      id: `item_${Date.now()}`,
      type: 'custom',
      emoji,
      name: '아이템',
      x: 40,
      y: 40,
      zIndex: 50,
      scale: 1,
      rotation: 0,
    };
    setItems(prev => [...prev, newItem]);
    setSelectedId(newItem.id);
    if (onCloseAdding) onCloseAdding();
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent, clientX: number, clientY: number, id: string, target: HTMLElement) => {
    if (!isEditable) return;
    if ('button' in e && e.button !== 0) return; // Only allow left click
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setDraggingId(id);
    setSelectedId(id);
    const rect = target.getBoundingClientRect();
    setOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, zIndex: 100 } : i))
    );
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!draggingId || !roomRef.current || !isEditable) return;

    const roomRect = roomRef.current.getBoundingClientRect();
    const target = document.getElementById(`miniroom-item-${draggingId}`);
    const itemWidth = target ? target.offsetWidth : 80;
    const itemHeight = target ? target.offsetHeight : 80;
    
    let newX = clientX - roomRect.left - offset.x;
    let newY = clientY - roomRect.top - offset.y;

    let pctX = (newX / roomRect.width) * 100;
    let pctY = (newY / roomRect.height) * 100;

    const itemWidthPct = (itemWidth / roomRect.width) * 100;
    const itemHeightPct = (itemHeight / roomRect.height) * 100;

    pctX = Math.max(0, Math.min(pctX, 100 - itemWidthPct));
    pctY = Math.max(0, Math.min(pctY, 100 - itemHeightPct));

    setItems((prev) =>
      prev.map((i) => (i.id === draggingId ? { ...i, x: pctX, y: pctY } : i))
    );

    // Check trash collision
    if (trashRef.current) {
      const trashRect = trashRef.current.getBoundingClientRect();
      const isOver = (
        clientX >= trashRect.left &&
        clientX <= trashRect.right &&
        clientY >= trashRect.top &&
        clientY <= trashRect.bottom
      );
      setIsOverTrash(isOver);
    }
  };

  const handleEnd = () => {
    if (!draggingId || !isEditable) return;

    if (isOverTrash) {
      setItems(prev => prev.filter(i => i.id !== draggingId));
      setSelectedId(null);
    } else {
      setItems((prev) =>
        prev.map((i) => {
          if (i.id === draggingId) {
            const baseZ = i.type === 'character' ? 10 : 1;
            return { ...i, zIndex: baseZ };
          }
          return i;
        })
      );
    }

    setDraggingId(null);
    setIsOverTrash(false);
  };

  const handleUpdateTransform = (id: string, updates: Partial<RoomItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const getFloorStyle = () => {
    const base = { backgroundColor: bgConfig.floorColor };
    if (bgConfig.floorPattern === 'dots') {
      return { ...base, backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' };
    }
    if (bgConfig.floorPattern === 'grid') {
      return { ...base, backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' };
    }
    if (bgConfig.floorPattern === 'wood') {
      return { ...base, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.05) 19px, rgba(0,0,0,0.05) 20px)' };
    }
    return base;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-cy-gray animate-fade-in overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        <div className="w-full h-[40%] border-b-2 border-gray-400 flex items-end justify-center pb-4 md:pb-8 transition-colors duration-500" style={{ backgroundColor: bgConfig.wallColor }}>
          {bgConfig.windowType !== 'none' && (
            <div className={`w-32 h-20 md:w-48 md:h-28 border-4 border-white rounded-md shadow-inner flex items-center justify-center overflow-hidden relative transition-colors duration-500
              ${bgConfig.windowType === 'day' ? 'bg-sky-300' : 
                bgConfig.windowType === 'night' ? 'bg-indigo-900' : 
                'bg-orange-400'}`}
            >
              <div className="absolute inset-0 border-x-2 border-white/50 w-1/2 mx-auto" />
              <div className="absolute inset-0 border-y-2 border-white/50 h-1/2 my-auto" />
            </div>
          )}
        </div>
        <div className="w-full h-[60%] relative transition-colors duration-500" style={getFloorStyle()}>
        </div>
      </div>

      {/* Trash Bin Area (Visible only when dragging) */}
      {isEditable && (
        <div 
          ref={trashRef}
          className={`
            absolute top-4 right-4 z-[60] w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
            transition-all duration-200 border-2
            ${draggingId ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}
            ${isOverTrash ? 'bg-red-500 border-white text-white scale-125' : 'bg-white/50 border-red-500 text-red-500'}
          `}
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-3xl">🗑️</span>
            <span className="text-[8px] md:text-[10px] font-pixel">삭제</span>
          </div>
        </div>
      )}

      {/* Emoji Picker Overlay */}
      {isAddingItem && isEditable && (
        <div className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-in flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-pixel text-lg">아이템 선택</h3>
              <button 
                onClick={onCloseAdding}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 flex-1">
              {EMOJI_CATEGORIES.map((category, catIdx) => (
                <details key={catIdx} className="group border border-gray-200 rounded-lg bg-gray-50">
                  <summary className="font-pixel text-sm text-gray-700 p-3 cursor-pointer list-none flex justify-between items-center hover:bg-gray-100 rounded-lg transition-colors">
                    {category.name}
                    <span className="transition-transform duration-200 group-open:rotate-180">▼</span>
                  </summary>
                  <div className="p-3 bg-white border-t border-gray-200 rounded-b-lg">
                    <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                      {category.emojis.map((emoji, idx) => (
                        <button
                          key={`${catIdx}-${idx}`}
                          onClick={() => handleAddItem(emoji)}
                          className="text-3xl p-2 hover:bg-gray-100 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Background Settings Overlay */}
      {isEditingBg && isEditable && (
        <div className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-pixel text-lg">배경 설정</h3>
              <button onClick={onCloseBg} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-2 space-y-6 flex-1">
              
              {/* Window */}
              <div>
                <h4 className="font-pixel text-sm text-gray-500 mb-2">창문</h4>
                <div className="flex gap-2">
                  {[
                    { id: 'day', label: '낮 ☀️' },
                    { id: 'sunset', label: '노을 🌇' },
                    { id: 'night', label: '밤 🌙' },
                    { id: 'none', label: '없음 ❌' }
                  ].map(w => (
                    <button key={w.id} onClick={() => setBgConfig(p => ({...p, windowType: w.id as any}))}
                      className={`px-3 py-2 rounded-lg font-pixel text-xs border-2 transition-colors ${bgConfig.windowType === w.id ? 'border-cy-blue bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wall */}
              <div>
                <h4 className="font-pixel text-sm text-gray-500 mb-2">벽지 색상</h4>
                <div className="flex flex-wrap gap-2">
                  {WALL_COLORS.map(c => (
                    <button key={c} onClick={() => setBgConfig(p => ({...p, wallColor: c}))}
                      className={`w-8 h-8 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${bgConfig.wallColor === c ? 'border-cy-blue scale-110' : 'border-gray-300'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Floor Color */}
              <div>
                <h4 className="font-pixel text-sm text-gray-500 mb-2">바닥 색상</h4>
                <div className="flex flex-wrap gap-2">
                  {FLOOR_COLORS.map(c => (
                    <button key={c} onClick={() => setBgConfig(p => ({...p, floorColor: c}))}
                      className={`w-8 h-8 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${bgConfig.floorColor === c ? 'border-cy-blue scale-110' : 'border-gray-300'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Floor Pattern */}
              <div>
                <h4 className="font-pixel text-sm text-gray-500 mb-2">바닥 패턴</h4>
                <div className="flex gap-2">
                  {[
                    { id: 'none', label: '없음' },
                    { id: 'dots', label: '도트' },
                    { id: 'grid', label: '격자' },
                    { id: 'wood', label: '나무' }
                  ].map(p => (
                    <button key={p.id} onClick={() => setBgConfig(prev => ({...prev, floorPattern: p.id as any}))}
                      className={`px-3 py-2 rounded-lg font-pixel text-xs border-2 transition-colors ${bgConfig.floorPattern === p.id ? 'border-cy-blue bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Draggable Area */}
      <div 
        ref={roomRef}
        className="absolute inset-0 z-20"
        onClick={() => !draggingId && setSelectedId(null)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onMouseUp={handleEnd}
        onTouchEnd={handleEnd}
        onMouseLeave={handleEnd}
        onTouchCancel={handleEnd}
      >
        {/* Items */}
        {items.map((item) => (
          <div
            id={`miniroom-item-${item.id}`}
            key={item.id}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleStart(e, e.clientX, e.clientY, item.id, e.currentTarget as HTMLElement);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleStart(e, e.touches[0].clientX, e.touches[0].clientY, item.id, e.currentTarget as HTMLElement);
            }}
            className={`
              absolute flex items-center justify-center
              select-none transition-transform duration-200
              ${draggingId === item.id ? 'scale-125 rotate-3 z-[100]' : ''}
              ${selectedId === item.id && !draggingId ? 'ring-4 ring-cy-blue ring-offset-2 rounded-full bg-white/20' : ''}
              ${isEditable ? (draggingId === item.id ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}
            `}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              zIndex: item.zIndex,
              touchAction: isEditable ? 'none' : 'auto',
              transform: `scale(${item.scale || 1}) rotate(${item.rotation || 0}deg)`
            }}
          >
            <span className="text-5xl md:text-6xl">{item.emoji}</span>
          </div>
        ))}
      </div>

      {/* Selected Item Controls */}
      {isEditable && selectedId && !draggingId && (
        <div className="absolute top-4 left-4 z-[60] bg-white/90 backdrop-blur p-4 rounded-xl shadow-xl border border-gray-200 w-48 animate-slide-in-left">
          <div className="flex justify-between items-center mb-3">
            <span className="font-pixel text-xs text-gray-500">크기 & 각도</span>
            <button onClick={() => setSelectedId(null)} className="text-xs text-gray-400 p-1">닫기</button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-pixel mb-1">
                <span>크기</span>
                <span>{Math.round((items.find(i => i.id === selectedId)?.scale || 1) * 100)}%</span>
              </div>
              <input 
                type="range" min="0.5" max="3" step="0.1"
                value={items.find(i => i.id === selectedId)?.scale || 1}
                onChange={(e) => handleUpdateTransform(selectedId, { scale: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cy-blue"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-pixel mb-1">
                <span>회전</span>
                <span>{items.find(i => i.id === selectedId)?.rotation || 0}°</span>
              </div>
              <input 
                type="range" min="-180" max="180" step="5"
                value={items.find(i => i.id === selectedId)?.rotation || 0}
                onChange={(e) => handleUpdateTransform(selectedId, { rotation: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cy-blue"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-pixel mb-1">
                <span>레이어 (순서)</span>
                <span>{items.find(i => i.id === selectedId)?.zIndex || 0}</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleUpdateTransform(selectedId, { zIndex: (items.find(i => i.id === selectedId)?.zIndex || 1) - 1 })}
                  className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-pixel"
                >
                  뒤로
                </button>
                <button 
                  onClick={() => handleUpdateTransform(selectedId, { zIndex: (items.find(i => i.id === selectedId)?.zIndex || 1) + 1 })}
                  className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-pixel"
                >
                  앞으로
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Indicator */}
      {!isEditable && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <div className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white border-2 border-white rounded-lg font-pixel text-sm shadow-md opacity-80">
            <Lock size={14} />
            관람 모드
          </div>
        </div>
      )}
    </div>
  );
};

export default Miniroom;
