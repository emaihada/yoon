import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { User } from 'firebase/auth';
import { ContentItem } from '../types';
import { subscribeToContent, addContentItem, updateContentItem, deleteContentItem } from '../services/firebase';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Plus, X, Trash2, Edit2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface PageProps {
  user: User | null;
}

const PictureDiaryPage: React.FC<PageProps> = ({ user }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal states
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ContentItem | null>(null);
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState('');
  
  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(currentDate.getMonth());

  useEffect(() => {
    const unsubscribe = subscribeToContent('picture_diary', setItems);
    return () => unsubscribe();
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingItem = items.find(item => item.dateString === dateStr);

    setSelectedDate(dateStr);
    
    if (existingItem) {
      setViewItem(existingItem);
      setIsEditing(false);
      setImageUrl(existingItem.imageUrl || '');
      setContent(existingItem.content);
      setIsModalOpen(true);
    } else if (user) {
      // Admin can create new
      setViewItem(null);
      setIsEditing(true);
      setImageUrl('');
      setContent('');
      setIsModalOpen(true);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !imageUrl.trim() || !content.trim()) return;

    const payload = {
      category: 'picture_diary',
      dateString: selectedDate,
      imageUrl: imageUrl.trim(),
      content: content.trim(),
      createdAt: Date.now(),
    };

    if (viewItem) {
      await updateContentItem(viewItem.id, payload);
    } else {
      await addContentItem(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteContentItem(deleteId);
      setDeleteId(null);
      setIsModalOpen(false);
    }
  };

  const renderCalendar = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 relative rounded-t-lg">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => {
                setPickerYear(year);
                setPickerMonth(month);
                setShowDatePicker(!showDatePicker);
              }} 
              className="text-lg font-bold font-pixel text-cy-dark hover:text-cy-orange transition-colors flex items-center gap-1"
            >
              {year}년 {month + 1}월 ▾
            </button>
            
            {showDatePicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 shadow-xl rounded-lg p-3 z-30 flex flex-col gap-2 min-w-[180px]">
                <div className="flex gap-2">
                  <select 
                    value={pickerYear} 
                    onChange={(e) => setPickerYear(parseInt(e.target.value))}
                    className="flex-1 p-1 border border-gray-200 rounded font-pixel text-sm focus:outline-none focus:border-cy-orange"
                  >
                    {Array.from({ length: 21 }, (_, i) => year - 10 + i).map(y => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select 
                    value={pickerMonth} 
                    onChange={(e) => setPickerMonth(parseInt(e.target.value))}
                    className="flex-1 p-1 border border-gray-200 rounded font-pixel text-sm focus:outline-none focus:border-cy-orange"
                  >
                    {Array.from({ length: 12 }, (_, i) => i).map(m => (
                      <option key={m} value={m}>{m + 1}월</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => {
                    setCurrentDate(new Date(pickerYear, pickerMonth, 1));
                    setShowDatePicker(false);
                  }}
                  className="w-full py-1 bg-cy-orange text-white rounded font-pixel text-sm hover:bg-orange-600 transition-colors"
                >
                  이동
                </button>
              </div>
            )}
          </div>

          <button onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 text-center border-b border-gray-100 bg-gray-50/50">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div key={day} className={`py-2 text-xs font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr rounded-b-lg overflow-hidden">
          {blanks.map(blank => (
            <div key={`blank-${blank}`} className="aspect-square border-b border-r border-gray-100 bg-gray-50/30"></div>
          ))}
          
          {days.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const item = items.find(i => i.dateString === dateStr);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;

            return (
              <div 
                key={day} 
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square border-b border-r border-gray-100 relative transition-colors overflow-hidden
                  ${(item || user) ? 'cursor-pointer hover:bg-orange-50' : ''}
                  ${isToday && !item ? 'bg-orange-50/30' : ''}
                `}
              >
                {item && item.imageUrl && (
                  <div className="absolute inset-0 z-0">
                    <img src={item.imageUrl} alt="diary" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="absolute top-1 left-1 z-10">
                  <span className={`text-[10px] md:text-xs font-bold px-1 rounded ${
                    isToday ? 'bg-cy-orange text-white' : 
                    item ? 'bg-white/80 text-gray-800 shadow-sm' : 
                    isWeekend ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {day}
                  </span>
                </div>
                
                {!item && user && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/5">
                    <Plus size={20} className="text-gray-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Layout title="그림일기">
      <div className="mb-4 text-center">
        <span className="text-[10px] md:text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block whitespace-nowrap">
          {user ? '날짜를 클릭하여 그림일기를 작성하세요.' : '그림이 있는 날짜를 클릭하면 일기를 볼 수 있습니다.'}
        </span>
      </div>

      {renderCalendar()}

      {/* Modal for View/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 md:pb-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80dvh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="font-bold font-pixel text-cy-dark">
                {selectedDate} 그림일기
              </h3>
              <div className="flex items-center gap-2">
                {user && viewItem && !isEditing && (
                  <>
                    <button onClick={() => setIsEditing(true)} className="p-1 text-gray-500 hover:text-cy-blue">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteId(viewItem.id)} className="p-1 text-gray-500 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-800">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">이미지 URL</label>
                    <input 
                      type="text" 
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full p-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-cy-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">일기 내용</label>
                    <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="오늘의 일기를 작성해주세요..."
                      className="w-full p-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-cy-orange h-32 resize-none"
                    />
                  </div>
                  
                  {imageUrl && (
                    <div className="mt-2 rounded overflow-hidden border border-gray-200 flex justify-center bg-gray-50">
                      <img src={imageUrl} alt="preview" className="w-full h-auto max-h-[30vh] object-contain" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400?text=Invalid+Image')} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {viewItem?.imageUrl && (
                    <div className="rounded overflow-hidden border border-gray-200 bg-gray-50 flex justify-center">
                      <img src={viewItem.imageUrl} alt="diary" className="w-full h-auto max-h-[40vh] object-contain" />
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 min-h-[100px] whitespace-pre-wrap font-hand text-gray-800 text-base">
                    {viewItem?.content}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {isEditing && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 shrink-0">
                <button 
                  onClick={() => viewItem ? setIsEditing(false) : setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50"
                >
                  취소
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!imageUrl.trim() || !content.trim()}
                  className="px-4 py-2 text-sm text-white bg-cy-orange rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  저장
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        title="삭제 확인"
        message="이 그림일기를 삭제하시겠습니까?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="삭제"
      />
    </Layout>
  );
};

export default PictureDiaryPage;
