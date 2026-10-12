export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  pronouns: string;
  age: number;
  city: string;
  relationshipStatus: string;
  currentVibe: string;
  bio: string;
  founderBadge: boolean;
  memberSince: string;
  vibeMeters: {
    trustworthy: number; // Confiável (0-100)
    cool: number;        // Legal (0-100)
    sexy: number;        // Ícone / Sexy (0-100)
  };
  stats: {
    scraps: number;
    photos: number;
    videos: number;
    testimonials: number;
    fans: number;
  };
}

export interface Scrap {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  badge?: string;
  likes: number;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  content: string;
  date: string;
  status: 'accepted' | 'pending';
}

export interface Friend {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isOnline: boolean;
  vibeTag: string;
}

export interface Community {
  id: string;
  name: string;
  category: string;
  memberCount: string;
  avatar: string;
  joined: boolean;
  description?: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  url: string;
  dateStamp: string;
  likes: number;
  commentsCount: number;
}
