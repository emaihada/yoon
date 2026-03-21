import React, { useState, useEffect } from 'react';
import { ContentItem, Comment } from '../types';
import { subscribeToComments, addComment, deleteComment } from '../services/firebase';
import { MessageCircle, Trash2, Send, ChevronDown, ChevronUp, Smile } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface MemoItemProps {
  item: ContentItem;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

const MemoItem: React.FC<MemoItemProps> = ({ item, isAdmin, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  // Subscribe to comments only when expanded to save resources
  useEffect(() => {
    let unsubscribe = () => {};
    if (isExpanded) {
      setLoadingComments(true);
      unsubscribe = subscribeToComments(item.id, (data) => {
        setComments(data);
        setLoadingComments(false);
      });
    }
    return () => unsubscribe();
  }, [isExpanded, item.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent toggling the accordion
    if (!name.trim() || !content.trim()) return;
    
    await addComment(item.id, name, content);
    setName('');
    setContent('');
  };

  const confirmDeleteComment = async () => {
    if (deleteCommentId) {
      await deleteComment(deleteCommentId, item.id);
      setDeleteCommentId(null);
    }
  };

  const handleDeleteCommentClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteCommentId(id);
  };

  const handleDeletePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  const handleSmileClick = () => {
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
    }, 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-3 transition-all">
      <ConfirmModal 
        isOpen={!!deleteCommentId}
        title="댓글 삭제"
        message="정말 이 댓글을 삭제하시겠습니까?"
        onConfirm={confirmDeleteComment}
        onCancel={() => setDeleteCommentId(null)}
        confirmText="삭제"
      />

      {/* Memo Content (Clickable Header) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 clickable relative hover:bg-gray-50 transition-colors"
      >
        {isAdmin && (
          <button 
            type="button" 
            onClick={handleDeletePost}
            className="absolute top-3 right-3 text-gray-300 hover:text-red-500 clickable p-1 z-10"
            title="글 삭제"
          >
            <Trash2 size={16} />
          </button>
        )}

        <div className="pr-6">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {item.content}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400 font-pixel">
            {new Date(item.createdAt).toLocaleString()}
          </span>
          <div className="flex items-center gap-1 text-xs font-bold text-cy-blue">
            <MessageCircle size={14} />
            <span>댓글</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded Comments Section (Thread Style) */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-100 p-3 animate-fade-in">
          
          {/* Comment List */}
          <div className="space-y-2 mb-3">
             {loadingComments && comments.length === 0 ? (
               <p className="text-center text-gray-400 text-xs py-2">로딩 중...</p>
             ) : comments.length === 0 ? (
               <p className="text-center text-gray-400 text-xs py-2">아직 댓글이 없습니다.</p>
             ) : (
               comments.map(comment => (
                 <div key={comment.id} className="bg-white border border-gray-200 p-2 rounded text-xs relative group">
                    {isAdmin && (
                      <button 
                        onClick={(e) => handleDeleteCommentClick(e, comment.id)}
                        className="absolute top-1 right-1 text-gray-300 hover:text-red-500 clickable p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-cy-orange">{comment.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 break-all">{comment.content}</p>
                 </div>
               ))
             )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-2 w-full">
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="이름"
                className="w-24 text-xs p-2 border border-gray-300 rounded focus:outline-none focus:border-cy-orange"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="relative">
                <div 
                  className="bg-orange-100 p-1.5 rounded-full text-cy-orange clickable cursor-pointer hover:bg-orange-200 transition-colors"
                  onClick={handleSmileClick}
                >
                  <Smile size={16} />
                </div>
                {/* Speech Bubble Tooltip */}
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-cy-dark text-white text-[10px] px-2 py-1 rounded shadow-lg animate-fade-in z-20 font-pixel">
                    실명으로 해주면 감사하겠어
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-cy-dark"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <input
                type="text"
                placeholder="댓글 달기..."
                className="flex-1 min-w-0 text-xs p-2 border border-gray-300 rounded focus:outline-none focus:border-cy-orange"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <button 
                type="submit"
                className="bg-cy-dark text-white rounded px-3 hover:bg-gray-700 transition-colors clickable flex items-center justify-center shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </form>

        </div>
      )}
    </div>
  );
};

export default MemoItem;