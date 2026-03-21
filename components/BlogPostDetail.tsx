import React, { useEffect, useState } from 'react';
import { ContentItem, Comment } from '../types';
import { addComment, deleteComment, subscribeToComments, incrementPostViews, incrementPostLikes, decrementPostLikes } from '../services/firebase';
import { ArrowLeft, Send, Trash2, MessageCircle, Smile, Eye, Heart } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface BlogPostDetailProps {
  post: ContentItem;
  isAdmin: boolean;
  onBack: () => void;
}

const BlogPostDetail: React.FC<BlogPostDetailProps> = ({ post, isAdmin, onBack }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  // Like State
  const [likes, setLikes] = useState(post.likeCount || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  useEffect(() => {
    // 1. Subscribe to comments
    const unsubscribe = subscribeToComments(post.id, setComments);

    // 2. Increment view count (once per mount)
    incrementPostViews(post.id);

    // 3. Check LocalStorage for Like status
    const likedKey = `liked_${post.id}`;
    if (localStorage.getItem(likedKey) === 'true') {
      setHasLiked(true);
    }

    return () => unsubscribe();
  }, [post.id]);

  // Sync likes state with prop updates (if real-time update comes in)
  useEffect(() => {
    if (post.likeCount !== undefined) {
      setLikes(post.likeCount);
    }
  }, [post.likeCount]);

  const handleLike = async () => {
    const likedKey = `liked_${post.id}`;

    if (hasLiked) {
      // Unlike Logic
      setLikes(prev => Math.max(0, prev - 1));
      setHasLiked(false);
      localStorage.removeItem(likedKey);
      await decrementPostLikes(post.id);
    } else {
      // Like Logic
      setLikes(prev => prev + 1);
      setHasLiked(true);
      setIsLikeAnimating(true);
      localStorage.setItem(likedKey, 'true');
      
      setTimeout(() => setIsLikeAnimating(false), 500);
      await incrementPostLikes(post.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    
    await addComment(post.id, name, content);
    setName('');
    setContent('');
  };

  const confirmDeleteComment = async () => {
    if (deleteCommentId) {
      await deleteComment(deleteCommentId, post.id);
      setDeleteCommentId(null);
    }
  };

  const handleSmileClick = () => {
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col animate-fade-in">
      <ConfirmModal 
        isOpen={!!deleteCommentId}
        title="댓글 삭제"
        message="정말 이 댓글을 삭제하시겠습니까?"
        onConfirm={confirmDeleteComment}
        onCancel={() => setDeleteCommentId(null)}
        confirmText="삭제"
      />

      {/* Title & Back Button Section */}
      <div className="mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={onBack}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors clickable -ml-2"
            title="뒤로가기"
          >
            <ArrowLeft size={24} className="text-cy-dark" />
          </button>
          <div className="flex-1">
             <h2 className="text-xl md:text-2xl font-bold font-pixel text-cy-dark break-keep leading-snug">
              {post.title || "무제"}
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-between pl-2">
          <div className="flex items-center gap-4 text-xs text-gray-400 font-pixel">
            <span>{new Date(post.createdAt).toLocaleString()}</span>
            {isAdmin && (
              <div className="flex items-center gap-1">
                <Eye size={12} />
                <span>Hit: {post.views ? post.views + 1 : 1}</span> 
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content (Markdown) */}
      <div className="mb-6 pl-2 min-h-[150px]">
        {/* Markdown Renderer */}
        <div className="markdown-body text-gray-800 text-base font-hand">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Like Button Section (Moved to Bottom-Left) */}
      <div className="flex justify-start mb-4 pl-2">
        <button
          onClick={handleLike}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 group
            ${hasLiked 
              ? 'bg-red-50 border-red-200 text-red-500' 
              : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400 clickable'
            }
          `}
        >
          <div className={`transition-transform duration-300 ${isLikeAnimating ? 'scale-150' : 'scale-100'}`}>
            <Heart 
              size={18} 
              fill={hasLiked ? "currentColor" : "none"} 
              className={hasLiked ? "text-red-500" : ""}
            />
          </div>
          {/* Only Show count, No text */}
          <span className="font-pixel font-bold text-sm min-w-[10px] text-center">
            {likes > 0 ? likes : 0}
          </span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="mt-2 border-t border-gray-100 pt-6">
        <h3 className="font-bold text-cy-dark mb-4 font-pixel flex items-center gap-2 text-sm pl-2">
          <MessageCircle size={16} />
          댓글 <span className="text-cy-orange">{comments.length}</span>
        </h3>

        {/* Comment List */}
        <div className="space-y-3 mb-4 px-1">
          {comments.length === 0 ? (
            <p className="text-gray-400 text-xs py-2 pl-2">첫 번째 댓글을 남겨보세요!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50/50 border border-gray-100 rounded p-3 text-sm relative group hover:bg-gray-50 transition-colors">
                {isAdmin && (
                  <button 
                    onClick={() => setDeleteCommentId(comment.id)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 clickable"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-cy-blue text-xs">{comment.name}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap text-xs">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Form */}
        <div className="bg-white pt-2 pb-0">
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="이름"
                  className="w-24 text-xs p-2 border border-gray-200 rounded focus:outline-none focus:border-cy-orange bg-white"
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
                <textarea
                  placeholder="댓글을 입력하세요..."
                  className="flex-1 min-w-0 text-xs p-2 focus:outline-none resize-none h-10 border border-gray-200 rounded focus:border-cy-orange bg-white"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                <button 
                  type="submit"
                  className="bg-cy-dark text-white rounded px-4 py-1 hover:bg-gray-700 transition-colors clickable flex items-center justify-center shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetail;