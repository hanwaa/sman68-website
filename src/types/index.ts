export interface Achievement {
  id: string;
  title: string;
  description: string;
  level: "internasional" | "nasional" | "provinsi" | "kota" | "sekolah";
  category: "akademik" | "olahraga" | "seni" | "teknologi" | "sains" | "sosial";
  awardType: "juara1" | "juara2" | "juara3" | "semifinal" | "partisipasi" | "penghargaan";
  year: number;
  imageUrl?: string;
  participants?: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  authorName: string;
  category: string;
  publishedAt: string;
  views: number;
  tags?: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  isPublic: boolean;
  color?: string;
}

export interface Extracurricular {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "olahraga" | "seni" | "akademik" | "teknologi" | "sosial" | "keagamaan";
  logoUrl?: string;
  memberCount?: number;
  scheduleDay?: string;
  achievements?: number;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  images: string[];
  floor?: number;
  capacity?: number;
  category: string;
}

export interface Teacher {
  id: string;
  name: string;
  avatarUrl?: string;
  subject: string;
  position?: string;
  bio?: string;
}

export interface DashboardUser {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  class?: string;
  email: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  isPinned: boolean;
  isUrgent: boolean;
  publishedAt: string;
  expiresAt?: string;
  targetRole?: string[];
}

export interface Notification {
  id: string;
  type: "pengumuman" | "agenda" | "prestasi" | "sistem";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
