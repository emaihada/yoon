import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ContentList from '../components/ContentList';
import BlogPostDetail from '../components/BlogPostDetail';
import { User } from 'firebase/auth';
import { ContentItem } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { getContentItem } from '../services/firebase';

interface PageProps {
  user: User | null;
}

const Log: React.FC<PageProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Effect to handle URL ID changes
  useEffect(() => {
    const fetchPost = async () => {
      if (id) {
        setLoading(true);
        const post = await getContentItem(id);
        if (post) {
          if (post.isSecret && !user) {
            alert('비밀글입니다.');
            navigate('/log', { replace: true });
          } else {
            setSelectedPost(post);
          }
        } else {
          // Post not found, go back to list
          navigate('/log', { replace: true });
        }
        setLoading(false);
      } else {
        setSelectedPost(null);
      }
    };

    fetchPost();
  }, [id, navigate, user]);

  // Custom title with breadcrumb for Detail View
  const getTitle = () => {
    if (selectedPost || id) {
      return (
        <div className="flex items-center gap-2">
          <span 
            onClick={() => navigate('/log')} 
            className="cursor-pointer hover:underline hover:text-cy-blue transition-colors"
          >
            다이어리
          </span>
          <span className="text-gray-300 text-sm font-hand">&gt;</span>
          <span>읽기</span>
        </div>
      );
    }
    
    // Standard title for list view
    return "다이어리";
  };

  // If loading a specific post
  if (loading) {
    return (
      <Layout title={getTitle()}>
        <div className="flex items-center justify-center h-60">
          <div className="font-pixel text-cy-orange animate-bounce">글 불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  // If a post is selected (via URL), show the detail view
  if (selectedPost) {
    return (
      <Layout title={getTitle()}>
        <BlogPostDetail 
          post={selectedPost} 
          isAdmin={!!user} 
          onBack={() => navigate('/log')} 
        />
      </Layout>
    );
  }

  return (
    <Layout title={getTitle()}>
      {/* Warning Message moved from title to content area for better alignment */}
      <div className="mb-4 text-center">
        <span className="text-[10px] md:text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block whitespace-nowrap">
          ※댓글 삭제는 최윤하에게 요청하지 않으면 불가능※
        </span>
      </div>

      <ContentList 
        category="blog" 
        isAdmin={!!user}
        showTitleInput
        showImageInput // Enable image URL input for Blog
        displayMode="blog"
        placeholder="오늘의 다이어리를 작성해보세요..."
        onItemClick={(item) => navigate(`/log/${item.id}`)}
      />
    </Layout>
  );
};

export default Log;