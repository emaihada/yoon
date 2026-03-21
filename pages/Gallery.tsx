import React, { useState } from 'react';
import Layout from '../components/Layout';
import ContentList from '../components/ContentList';
import { User } from 'firebase/auth';
import { ContentItem } from '../types';
import { incrementPostViews } from '../services/firebase';
import { X, Eye } from 'lucide-react';

interface PageProps {
  user: User | null;
}

const Gallery: React.FC<PageProps> = ({ user }) => {
  const [selectedPost, setSelectedPost] = useState<ContentItem | null>(null);

  // Handle opening the detail view (Lightbox)
  const handlePostClick = (item: ContentItem) => {
    setSelectedPost(item);
    incrementPostViews(item.id);
  };

  const closeLightbox = () => {
    setSelectedPost(null);
  };

  return (
    <Layout title="사진첩">
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 md:p-4 min-h-[500px]">
        
        {/* Gallery Grid */}
        <ContentList 
          category="gallery" 
          isAdmin={!!user}
          inputMode="gallery" // Use the simple input mode
          displayMode="gallery"
          onItemClick={handlePostClick}
        />

        {/* Custom Lightbox / Detail Modal */}
        {selectedPost && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-fade-in p-4">
            
            {/* Close Button */}
            <button 
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/70 hover:text-white clickable"
            >
              <X size={32} />
            </button>

            {/* Info Header (Title & Date) */}
            <div className="text-white text-center mb-4 space-y-1">
               {selectedPost.title && (
                 <h2 className="text-xl font-bold font-pixel tracking-wide">{selectedPost.title}</h2>
               )}
               <div className="flex items-center justify-center gap-3 text-xs text-gray-400 font-pixel">
                  <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                  {/* View count visible only to admin */}
                  {user && (
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      <span>{selectedPost.views ? selectedPost.views + 1 : 1}</span>
                    </div>
                  )}
               </div>
            </div>

            {/* Large Image */}
            <div className="relative max-w-full max-h-[80vh] overflow-hidden rounded shadow-2xl border-4 border-white">
               {selectedPost.imageUrl && (
                 <img 
                   src={selectedPost.imageUrl} 
                   alt={selectedPost.title || "Gallery Image"} 
                   className="max-w-full max-h-[75vh] object-contain"
                 />
               )}
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
};

export default Gallery;