import React, { useEffect, useState } from 'react';
import { addContentItem, deleteContentItem, updateContentItem, subscribeToContent, toggleContentPin } from '../services/firebase';
import { ContentItem } from '../types';
import { Trash2, PlusCircle, ArrowRight, Image as ImageIcon, Pin, HelpCircle, X, Edit2, CheckSquare, Square, ChevronDown, ChevronRight, Eye, Link as LinkIcon, Lock } from 'lucide-react';
import MemoItem from './MemoItem';
import ConfirmModal from './ConfirmModal';

interface ContentListProps {
  category: string; // e.g., 'manual_do', 'blog', 'memo', 'gallery'
  title?: string;
  isAdmin: boolean;
  showTitleInput?: boolean;
  showLinkInput?: boolean;
  showImageInput?: boolean; 
  inputMode?: 'standard' | 'gallery'; // New prop to switch form layout
  placeholder?: string;
  displayMode?: 'list' | 'card' | 'blog' | 'gallery';
  onItemClick?: (item: ContentItem) => void;
}

const ContentList: React.FC<ContentListProps> = ({ 
  category, 
  isAdmin, 
  title, 
  showTitleInput, 
  showLinkInput,
  showImageInput,
  inputMode = 'standard', // Default to standard editor
  placeholder = "내용을 입력하세요...",
  displayMode = 'list',
  onItemClick
}) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  
  // Form State
  const [newItemText, setNewItemText] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemLink, setNewItemLink] = useState('');
  const [galleryImageUrl, setGalleryImageUrl] = useState(''); // Specific state for gallery URL input
  const [isImageIncluded, setIsImageIncluded] = useState(false); 
  const [isSecret, setIsSecret] = useState(false); // New state for secret posts
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
  
  // Markdown Guide Accordion State
  const [activeGuideTab, setActiveGuideTab] = useState<string | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToContent(category, setItems);
    return () => unsubscribe();
  }, [category]);

  const resetForm = () => {
    setNewItemText('');
    setNewItemTitle('');
    setNewItemLink('');
    setGalleryImageUrl('');
    setIsImageIncluded(false);
    setIsSecret(false);
    setEditingId(null);
  };

  const handleEditClick = (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();
    setEditingId(item.id);
    setNewItemTitle(item.title || '');
    setNewItemText(item.content);
    setNewItemLink(item.link || '');
    setIsSecret(!!item.isSecret);
    
    if (inputMode === 'gallery') {
      setGalleryImageUrl(item.imageUrl || '');
    } else {
      setIsImageIncluded(!!item.imageUrl);
    }
    
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on mode
    if (inputMode === 'gallery') {
      if (!galleryImageUrl.trim()) return;
    } else {
      if (!newItemText.trim()) return;
    }

    let finalImageUrl = '';

    // Image logic based on mode
    if (inputMode === 'gallery') {
      finalImageUrl = galleryImageUrl.trim();
    } else if (isImageIncluded) {
      // Standard mode: extract from markdown
      const imgMatch = newItemText.match(/!\[.*?\]\((.*?)\)/);
      if (imgMatch && imgMatch[1]) {
        finalImageUrl = imgMatch[1];
      } else {
        finalImageUrl = 'placeholder'; 
      }
    }

    const payload: any = {
      content: inputMode === 'gallery' ? 'Gallery Image' : newItemText, // Default content for gallery
      isSecret: isSecret,
    };

    if (showTitleInput || inputMode === 'gallery') payload.title = newItemTitle;
    if (showLinkInput) payload.link = newItemLink;
    
    // Always save imageUrl if it exists
    if (finalImageUrl) payload.imageUrl = finalImageUrl;

    if (editingId) {
      // Update existing
      await updateContentItem(editingId, payload);
    } else {
      // Create new
      payload.category = category;
      payload.createdAt = Date.now();
      payload.commentCount = 0;
      payload.isPinned = false;
      payload.views = 0; 
      await addContentItem(payload);
    }
    
    resetForm();
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteContentItem(deleteId);
      setDeleteId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const handlePinClick = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    await toggleContentPin(id, category, currentStatus);
  };

  const toggleGuideTab = (tab: string) => {
    setActiveGuideTab(activeGuideTab === tab ? null : tab);
  };

  // Determine container classes based on displayMode
  const getContainerClass = () => {
    if (displayMode === 'gallery') return 'grid grid-cols-3 gap-1 md:gap-4';
    if (displayMode === 'card') return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    return 'space-y-2';
  };

  return (
    <div className="mb-8">
      <ConfirmModal 
        isOpen={!!deleteId}
        title="삭제 확인"
        message="정말 이 게시물을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="삭제"
      />

      {title && <h4 className="font-bold text-lg text-cy-dark mb-2 font-pixel bg-gray-100 px-2 rounded inline-block">{title}</h4>}
      
      {isAdmin && (
        <form onSubmit={handleSubmit} className={`mb-6 bg-white p-3 border border-dashed rounded-lg text-sm shadow-sm relative transition-colors ${editingId ? 'border-cy-orange bg-orange-50/10' : 'border-gray-300'}`}>
          
          {/* Header Area inside Form */}
          <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-2">
               <span className={`font-bold text-xs px-2 py-1 rounded ${editingId ? 'bg-cy-orange text-white' : 'bg-gray-100 text-cy-dark'}`}>
                 {editingId ? '게시글 수정 중' : 'New Post'}
               </span>
               {editingId && (
                 <button type="button" onClick={resetForm} className="text-xs underline text-gray-500 hover:text-red-500">
                   취소
                 </button>
               )}
             </div>
             
             {/* Only show Guide button in standard mode */}
             {inputMode === 'standard' && (
                <button 
                  type="button" 
                  onClick={() => setShowMarkdownGuide(!showMarkdownGuide)}
                  className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded ${showMarkdownGuide ? 'bg-cy-dark text-white' : 'text-cy-blue hover:bg-blue-50'}`}
                >
                  {showMarkdownGuide ? <X size={12} /> : <HelpCircle size={12} />}
                  {showMarkdownGuide ? '가이드 닫기' : '문법 가이드'}
                </button>
             )}
          </div>

          {/* Standard Mode: Markdown Guide */}
          {inputMode === 'standard' && showMarkdownGuide && (
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 font-mono animate-fade-in overflow-hidden shadow-inner">
              
              {/* Category 1: Headers */}
              <div className="border-b border-gray-200">
                <button type="button" onClick={() => toggleGuideTab('headers')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 text-left font-bold text-cy-dark">
                  <span>[글씨 크기]</span>
                  {activeGuideTab === 'headers' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {activeGuideTab === 'headers' && (
                  <div className="p-2 bg-white space-y-1">
                    <div className="flex gap-2"><code className="text-orange-500 font-bold"># 1</code> <span className="text-gray-400">→</span> <span className="text-xl font-bold">제목</span></div>
                    <div className="flex gap-2"><code className="text-gray-700">## 2</code> <span className="text-gray-400">→</span> <span className="text-lg font-bold">큰 글씨 1</span></div>
                    <div className="flex gap-2"><code className="text-gray-700">### 3</code> <span className="text-gray-400">→</span> <span className="text-base font-bold">큰 글씨 2</span></div>
                    <div className="flex gap-2"><code className="text-gray-700">#### 4</code> <span className="text-gray-400">→</span> <span className="text-sm font-bold">큰 글씨 3</span></div>
                    <div className="flex gap-2"><code className="text-gray-700">##### 5</code> <span className="text-gray-400">→</span> <span className="text-xs font-bold">작은 글씨 1</span></div>
                    <div className="flex gap-2"><code className="text-gray-700">###### 6</code> <span className="text-gray-400">→</span> <span className="text-[10px] font-bold">작은 글씨 2</span></div>
                  </div>
                )}
              </div>

              {/* Category 2: Emphasis */}
              <div className="border-b border-gray-200">
                <button type="button" onClick={() => toggleGuideTab('emphasis')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 text-left font-bold text-cy-dark">
                  <span>[강조]</span>
                  {activeGuideTab === 'emphasis' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {activeGuideTab === 'emphasis' && (
                  <div className="p-2 bg-white space-y-1">
                    <div className="flex gap-2"><code className="text-gray-700">**굵게**</code> <span className="text-gray-400">→</span> <strong>굵은 글씨</strong></div>
                    <div className="flex gap-2"><code className="text-gray-700">*연하게*</code> <span className="text-gray-400">→</span> <span className="text-gray-400">연한 글씨</span></div>
                    <div className="flex gap-2"><code className="text-gray-700">~~취소선~~</code> <span className="text-gray-400">→</span> <del>취소선</del></div>
                  </div>
                )}
              </div>

              {/* Category 3: Lists */}
              <div className="border-b border-gray-200">
                <button type="button" onClick={() => toggleGuideTab('lists')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 text-left font-bold text-cy-dark">
                  <span>[목록]</span>
                  {activeGuideTab === 'lists' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {activeGuideTab === 'lists' && (
                  <div className="p-2 bg-white space-y-1">
                    <div className="flex gap-2"><code className="text-gray-700">- 항목</code> <span className="text-gray-400">→</span> <span>• 항목</span></div>
                    <div className="flex gap-2"><code className="text-gray-700">1. 순서</code> <span className="text-gray-400">→</span> <span>1. 순서</span></div>
                    <div className="flex gap-2"><code className="text-gray-700">- [ ]</code>, <code className="text-gray-700">- [x]</code> <span className="text-gray-400">→</span> <span>☐ 체크박스</span></div>
                  </div>
                )}
              </div>

              {/* Category 4: Links & Images */}
              <div className="border-b border-gray-200">
                <button type="button" onClick={() => toggleGuideTab('media')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 text-left font-bold text-cy-dark">
                  <span>[링크 및 이미지]</span>
                  {activeGuideTab === 'media' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {activeGuideTab === 'media' && (
                  <div className="p-2 bg-white space-y-1">
                    <div className="flex flex-col gap-1 mb-2">
                       <div><code className="text-blue-500">[링크텍스트](URL)</code></div>
                       <div className="text-gray-400 text-[10px]">예: [네이버](https://naver.com)</div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <div><code className="text-purple-500">![이미지설명](이미지주소URL)</code></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Category 5: Colors */}
              <div className="border-b border-gray-200">
                <button type="button" onClick={() => toggleGuideTab('colors')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 text-left font-bold text-cy-dark">
                  <span>[글자 색상]</span>
                  {activeGuideTab === 'colors' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {activeGuideTab === 'colors' && (
                  <div className="p-2 bg-white space-y-2">
                    <div className="text-[10px] text-gray-500 mb-2">HTML 태그를 사용하여 색상을 변경해보세요.</div>
                    <div className="grid grid-cols-1 gap-2">
                      <code className="text-red-500 text-[10px]">&lt;span style="color:red"&gt;빨강&lt;/span&gt;</code>
                      <code className="text-blue-500 text-[10px]">&lt;span style="color:blue"&gt;파랑&lt;/span&gt;</code>
                      <code className="text-green-600 text-[10px]">&lt;span style="color:green"&gt;초록&lt;/span&gt;</code>
                      <code className="text-purple-500 text-[10px]">&lt;span style="color:purple"&gt;보라&lt;/span&gt;</code>
                      <code className="text-pink-500 text-[10px]">&lt;span style="color:pink"&gt;분홍&lt;/span&gt;</code>
                      <code className="text-cy-orange text-[10px]">&lt;span style="color:#ff8800"&gt;주황&lt;/span&gt;</code>
                    </div>
                  </div>
                )}
              </div>

               {/* Category 6: Others */}
               <div className="border-b border-gray-200">
                <button type="button" onClick={() => toggleGuideTab('others')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 text-left font-bold text-cy-dark">
                  <span>[인용 및 코드]</span>
                  {activeGuideTab === 'others' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {activeGuideTab === 'others' && (
                  <div className="p-2 bg-white space-y-3">
                    <div className="space-y-1">
                      <div className="flex gap-2"><code className="text-gray-700">&gt; 인용</code> <span className="text-gray-400">→</span> <span className="border-l-2 border-gray-300 pl-1 text-gray-500">인용문</span></div>
                      <div className="flex gap-2"><code className="text-gray-700">`코드`</code> <span className="text-gray-400">→</span> <span className="bg-gray-100 px-1 rounded">코드</span></div>
                      <div className="flex gap-2"><code className="text-gray-700">---</code> <span className="text-gray-400">→</span> <span className="text-gray-400 text-[10px]">(구분선)</span></div>
                    </div>
                    
                    {/* Code Block Example */}
                    <div className="bg-gray-50 p-2 rounded border border-gray-100 text-[10px]">
                      <div className="text-gray-500 mb-1 font-bold">코드블럭</div>
                      <div className="font-mono text-gray-700 leading-tight">
                        ```<br/>
                        코드블럭<br/>
                        ```
                      </div>
                    </div>

                    {/* Table Example */}
                    <div className="bg-gray-50 p-2 rounded border border-gray-100 text-[10px]">
                      <div className="text-gray-500 mb-1 font-bold">표 (Table)</div>
                      <div className="font-mono text-gray-700 leading-tight">
                        |제목|내용|<br/>
                        |-|-|<br/>
                        |왼쪽|오른쪽|
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* === FORM INPUTS === */}
          
          {inputMode === 'gallery' ? (
            /* GALLERY MODE INPUTS */
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                   <LinkIcon size={12} /> 이미지 주소 (URL)
                 </label>
                 <input 
                  className="w-full p-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-cy-orange bg-gray-50"
                  placeholder="https://example.com/image.jpg"
                  value={galleryImageUrl}
                  onChange={e => setGalleryImageUrl(e.target.value)}
                  required
                />
                <p className="text-[10px] text-gray-400">* 이미지가 호스팅된 웹 주소를 입력해주세요.</p>
              </div>

              <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-500">제목 (선택)</label>
                 <input 
                  className="w-full p-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-cy-orange" 
                  placeholder="사진 제목을 입력하세요" 
                  value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} 
                />
              </div>
            </div>
          ) : (
            /* STANDARD MODE INPUTS */
            <>
              {showTitleInput && (
                <input 
                  className="w-full border-b mb-3 p-1 focus:outline-none text-base font-bold text-cy-dark placeholder-gray-400 bg-transparent" 
                  placeholder="제목" 
                  value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} 
                />
              )}
              
              <div className="flex flex-col gap-2">
                <textarea 
                  className="w-full p-2 focus:outline-none resize-none h-60 border border-gray-200 rounded bg-gray-50/50 font-mono text-sm leading-relaxed" 
                  placeholder={`${placeholder}\n\n* '문법 가이드'를 열어 다양한 서식을 확인해보세요.`}
                  value={newItemText} onChange={e => setNewItemText(e.target.value)} 
                />
              </div>

              <div className="space-y-2 mt-3 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-4">
                {showLinkInput && (
                    <input 
                    className="flex-1 min-w-[200px] p-2 focus:outline-none text-xs text-blue-500 bg-gray-50 rounded border border-gray-100" 
                    placeholder="🔗 URL 링크 (선택사항)" 
                    value={newItemLink} onChange={e => setNewItemLink(e.target.value)} 
                  />
                )}
                
                {showImageInput && (
                    <button
                      type="button"
                      onClick={() => setIsImageIncluded(!isImageIncluded)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-bold transition-all ${
                        isImageIncluded 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {isImageIncluded ? <CheckSquare size={16} /> : <Square size={16} />}
                      이미지 포함
                    </button>
                )}
                
                {category === 'blog' && (
                    <button
                      type="button"
                      onClick={() => setIsSecret(!isSecret)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-bold transition-all ${
                        isSecret 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {isSecret ? <CheckSquare size={16} /> : <Square size={16} />}
                      비밀글
                    </button>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end mt-3">
             <button type="submit" className={`text-white text-sm px-4 py-2 rounded clickable flex items-center gap-1 shadow-sm transition-colors ${editingId ? 'bg-cy-orange hover:bg-orange-600' : 'bg-cy-dark hover:bg-gray-700'}`}>
               {editingId ? <Edit2 size={16}/> : <PlusCircle size={16}/>} 
               {editingId ? '수정 완료' : '글 등록'}
             </button>
          </div>
        </form>
      )}

      {/* Special Rendering for Memo Category */}
      {category === 'memo' ? (
        <div className="space-y-2">
          {items.filter(item => isAdmin || !item.isSecret).map(item => (
            <MemoItem 
              key={item.id} 
              item={item} 
              isAdmin={isAdmin} 
              onDelete={(id) => setDeleteId(id)} 
            />
          ))}
          {items.filter(item => isAdmin || !item.isSecret).length === 0 && <p className="text-gray-400 italic text-sm text-center py-4">아직 작성된 짧은 글이 없습니다.</p>}
        </div>
      ) : (
        /* Standard / Gallery Rendering */
        <div className={getContainerClass()}>
          {items.filter(item => isAdmin || !item.isSecret).map(item => {
            
            // --- GALLERY MODE ---
            if (displayMode === 'gallery') {
              return (
                <div 
                  key={item.id} 
                  onClick={() => onItemClick && onItemClick(item)}
                  className="relative aspect-square bg-gray-100 group cursor-pointer overflow-hidden border border-gray-100 rounded-sm"
                >
                   {item.imageUrl && item.imageUrl !== 'placeholder' ? (
                     <img src={item.imageUrl} alt={item.title || 'gallery image'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gray-50 text-gray-400">
                       <ImageIcon size={24} className="mb-1 opacity-50"/>
                       <span className="text-[10px] break-all line-clamp-2">{item.title || 'No Image'}</span>
                     </div>
                   )}
                   
                   {/* Hover Overlay */}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-4 z-10">
                      {/* Only show views to Admin in hover */}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Eye size={16} className="text-white" /> 
                          <span className="text-xs">{item.views || 0}</span>
                        </div>
                      )}
                   </div>

                   {/* Admin Actions Overlay (Top Right) */}
                   {isAdmin && (
                     <div className="absolute top-1 right-1 flex gap-1 z-20">
                       <button 
                        type="button" 
                        onClick={(e) => handleEditClick(e, item)}
                        className="text-white bg-black/50 hover:bg-cy-blue p-1 rounded-full clickable"
                        title="수정"
                      >
                        <Edit2 size={10} />
                      </button>
                       <button 
                        type="button" 
                        onClick={(e) => handleDeleteClick(e, item.id)}
                        className="text-white bg-black/50 hover:bg-red-500 p-1 rounded-full clickable"
                        title="삭제"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                  {item.isSecret && (
                    <div className="absolute top-1 left-1 z-20 bg-black/50 p-1 rounded-full">
                      <Lock size={10} className="text-white" />
                    </div>
                  )}
                </div>
              );
            }

            // --- STANDARD / BLOG MODE ---
            return (
              <div 
                key={item.id} 
                onClick={() => onItemClick && onItemClick(item)}
                className={`
                group relative p-3 rounded transition-all duration-200
                ${displayMode === 'blog' 
                  ? 'border-b border-gray-200 pb-2 mb-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between' 
                  : 'bg-white border border-gray-100 shadow-sm'}
                ${item.isPinned ? 'bg-orange-50/50 border-cy-orange/30' : ''}
              `}>
                {/* Admin Actions: Pin & Edit & Delete */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 z-10 bg-white/80 rounded px-1 backdrop-blur-sm shadow-sm group-hover:opacity-100 opacity-0 transition-opacity">
                     {/* Pin Button for Blog */}
                     {category === 'blog' && (
                       <button
                         type="button"
                         onClick={(e) => handlePinClick(e, item.id, !!item.isPinned)}
                         className={`p-1 clickable ${item.isPinned ? 'text-red-500' : 'text-gray-400 hover:text-red-300'}`}
                         title={item.isPinned ? "고정 해제" : "상단 고정"}
                       >
                         <Pin size={14} fill={item.isPinned ? "currentColor" : "none"} />
                       </button>
                     )}
                     <button 
                      type="button" 
                      onClick={(e) => handleEditClick(e, item)}
                      className="text-gray-400 hover:text-cy-blue clickable p-1"
                      title="수정"
                    >
                      <Edit2 size={14} />
                    </button>
                     <button 
                      type="button" 
                      onClick={(e) => handleDeleteClick(e, item.id)}
                      className="text-gray-400 hover:text-red-500 clickable p-1"
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                
                {displayMode === 'blog' ? (
                  // Blog List View (Title Only)
                  <>
                    <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0">
                       {/* Pinned Badge for Everyone */}
                       {item.isPinned && (
                          <Pin size={14} className="text-red-500 fill-red-500 shrink-0 mr-1" />
                       )}
                       {item.isSecret && (
                          <Lock size={14} className="text-gray-400 shrink-0 mr-1" />
                       )}
                       <span className="font-bold text-base group-hover:text-cy-orange transition-colors truncate pl-1">
                         {item.title || "무제"}
                       </span>
                       {item.commentCount !== undefined && item.commentCount > 0 && (
                          <span className="text-cy-orange text-xs font-pixel shrink-0 ml-1">
                            [{item.commentCount}]
                          </span>
                       )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                       {/* View Count (Visible only to Admin) */}
                       {isAdmin && (
                         <div className="flex items-center gap-1 text-gray-400 text-xs mr-1">
                           <span className="text-[10px] font-pixel">Hit:</span>
                           <span className="font-bold">{item.views || 0}</span>
                         </div>
                       )}
                       
                       <span className="text-xs text-gray-400 font-pixel whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString()}
                       </span>
                       
                       {/* Image Icon: Explicitly after Date */}
                       {item.imageUrl && <ImageIcon size={14} className="text-gray-400 shrink-0" />}
                       
                       <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                  </>
                ) : (
                  // Standard/Card View
                  <>
                    {item.title && (
                      <div className="font-bold text-base mb-1 flex items-center gap-2 group-hover:text-cy-orange transition-colors">
                        {item.isPinned && <Pin size={14} className="text-red-500 fill-red-500" />}
                        {item.isSecret && <Lock size={14} className="text-gray-400" />}
                        {item.title}
                      </div>
                    )}
                    <p className="text-gray-600 pr-6">{item.content}</p>
                  </>
                )}

                {item.link && displayMode !== 'blog' && (
                   <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-blue-400 hover:underline mt-1 block w-fit"
                    onClick={(e) => e.stopPropagation()}
                   >
                     보러가기 / 듣기 &rarr;
                   </a>
                )}
              </div>
            );
          })}
          {items.filter(item => isAdmin || !item.isSecret).length === 0 && <p className="text-gray-300 italic text-sm col-span-full text-center py-8">아직 내용이 없습니다...</p>}
        </div>
      )}
    </div>
  );
};

export default ContentList;