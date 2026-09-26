export type StudentAttendance = {
  date: Date;
  status: "Masuk" | "Izin" | "Sakit" | "Alpa";
};

export type StudentAnnouncement = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  isUrgent: boolean;
  isPinned: boolean;
  author: string;
};

export type StudentAchievement = {
  id: string;
  title: string;
  description?: string;
  level: string;
  year: number;
  category: string;
  status?: string;
};

export type StudentLeaderboard = {
  classes: { className: string; rank: number; points: number; total: number }[];
  students: { name: string; className: string; points: number; total: number }[];
  me: {
    name: string;
    className: string | null;
    total: number;
    points: number;
    classRank: number | null;
    classPoints: number;
    classTotal: number;
  } | null;
};
