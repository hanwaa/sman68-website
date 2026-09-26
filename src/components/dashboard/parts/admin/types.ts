export type AdminUser = {
  id: string;
  name: string;
  username: string;
  role: string;
  roleKey: "student" | "teacher" | "admin" | string;
  detail: string;
  status: string;
  nisn: string | null;
  className: string | null;
  nig: string | null;
  subject: string | null;
  position: string | null;
  homeroomName: string | null;
  activeSessions: number;
  lastLoginAt: string | null;
  createdAt: string | null;
};

export type PendingItem = {
  id: string;
  source: string;
  type: string;
  title: string;
  author: string;
  time: string;
  status: string;
};

export type AdminStats = {
  students: number;
  teachers: number;
  admins: number;
  activeUsers: number;
  news: number;
  newsDraft: number;
  announcements: number;
  achievements: number;
  achievementsPending: number;
  extracurriculars: number;
  alumni: number;
  classes: number;
  assignments: number;
  submissionsPending: number;
  eventsUpcoming: number;
  onlineSessions: number;
  loginsToday: number;
  presentToday: number;
  visitorsToday: number;
  pageviewsToday: number;
  pageviewsTotal: number;
  moderationPending: number;
  roles: { student: number; teacher: number; admin: number };
  weekly: { day: string; visitors: number; pageviews: number }[];
  topPages: { path: string; views: number }[];
  updatedAt: string;
};

export const USERS_PER_PAGE = 20;
