export interface GuestbookEntry {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  name: string;
  content: string;
  createdAt: number;
}

export interface ContentItem {
  id: string;
  category: string; // 'manual_do' | 'manual_dont' | 'taste' | 'wishlist' | 'culture' | 'blog' | 'memo'
  title?: string;
  content: string;
  link?: string; // For youtube/music links
  imageUrl?: string; // For blog post images
  createdAt: number;
  commentCount?: number;
  likeCount?: number; // New field for likes
  isPinned?: boolean; // New field for top-fixed posts
  views?: number; // New field for post view count
  isSecret?: boolean; // New field for secret posts
  dateString?: string; // New field for calendar date (YYYY-MM-DD)
}

export type SectionType = 'home' | 'about' | 'taste' | 'log';

export interface RoomItem {
  id: string;
  type: string;
  emoji: string;
  name: string;
  x: number;
  y: number;
  zIndex: number;
  scale: number;
  rotation: number;
}

export interface BackgroundConfig {
  wallColor: string;
  floorColor: string;
  floorPattern: 'none' | 'dots' | 'grid' | 'wood';
  windowType: 'none' | 'day' | 'night' | 'sunset';
}

export interface UserProfile {
  name: string;
  birthday: string;
  zodiac: string;
  chineseZodiac: string;
  bloodType: string;
  mbti: string;
  motto: string;
  instagram: string;
  email: string;
}

export interface Quest {
  id: string;
  title: string;
  desc: string;
  target: string;
  requiredCount: number;
  currentCount: number;
  rewardGold: number;
  rewardExp: number;
  status: 'available' | 'active' | 'completed' | 'rewarded';
}

export interface GuildMember {
  uid: string;
  nickname: string;
  role: 'leader' | 'member';
}
