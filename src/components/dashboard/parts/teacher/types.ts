export type TeacherAnnouncement = {
  id: string;
  title: string;
  body: string;
  time: string;
  urgent: boolean;
  pinned: boolean;
  audience: string;
  author: string;
};

export type AnnouncementDraft = {
  title: string;
  body: string;
  urgent: boolean;
  target: string;
};
