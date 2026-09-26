export const GRADES = [10, 11, 12] as const;
export const CLASSES_PER_GRADE = 8;
export const STUDENTS_PER_CLASS = 30;

export const GRADE_ROMAN: Record<number, string> = { 10: "X", 11: "XI", 12: "XII" };

export const SUBJECTS = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Fisika",
  "Kimia",
  "Biologi",
  "Ekonomi",
  "Sejarah",
  "Geografi",
  "Sosiologi",
  "PPKn",
  "Informatika",
];

export type SeedTeacher = {
  id: string;
  name: string;
  nig: string;
  subject: string;
  position: string;
  photo: string;
  homeroomId: string;
  homeroomName: string;
  room: string;
};

export type SeedHomeroom = {
  id: string;
  grade: number;
  name: string;
  teacherId: string;
  teacherName: string;
  room: string;
  sort: number;
};

export type SeedStudent = {
  id: string;
  name: string;
  nisn: string;
  className: string;
};

export type SeedScheduleSlot = {
  id: string;
  day: string;
  start: string;
  end: string;
  subject: string;
  className: string;
  room: string;
  teacher: string;
  sort: number;
};

export type SeedDigitalClass = {
  id: string;
  name: string;
  subject: string;
  section: string;
  room: string;
  code: string;
  teacherName: string;
  color: string;
  description: string;
};

export type SeedDigitalMember = { classId: string; studentId: string };
export type SeedDigitalPost = { id: string; classId: string; authorName: string; content: string };
export type SeedDigitalAssignment = {
  id: string;
  classId: string;
  title: string;
  instructions: string;
  topic: string;
  dueLabel: string;
  dueAtIso: string;
  points: number;
};
export type SeedDigitalSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  status: string;
};

const MALE_FIRST = [
  "Ahmad", "Andi", "Bagas", "Bayu", "Bima", "Budi", "Cahyo", "Danang", "Dimas", "Eko",
  "Fajar", "Galih", "Hafiz", "Ilham", "Joko", "Kevin", "Lukman", "Maulana", "Naufal", "Oka",
  "Putra", "Rafi", "Raka", "Reza", "Satria", "Taufik", "Umar", "Wahyu", "Yoga", "Zaki",
];

const FEMALE_FIRST = [
  "Aisyah", "Amelia", "Anisa", "Aulia", "Bella", "Bunga", "Citra", "Dewi", "Dinda", "Elsa",
  "Farah", "Fitri", "Gita", "Hana", "Indah", "Jihan", "Kirana", "Laras", "Maya", "Nadia",
  "Olivia", "Putri", "Rani", "Sari", "Tiara", "Ulfa", "Vina", "Wulan", "Yuni", "Zahra",
];

const MIDDLE_NAMES = [
  "Aditya", "Cahaya", "Dwi", "Fajar", "Gita", "Hidayat",
  "Indra", "Kusuma", "Lestari", "Nugraha", "Pratama", "Rahayu",
];

const LAST_NAMES = [
  "Anggraini", "Budiman", "Cahyono", "Darmawan", "Ekawati", "Firmansyah", "Gunawan",
  "Hartono", "Irawan", "Kartika", "Maulana", "Nuraini", "Oktavian", "Permata",
  "Ramadhan", "Salsabila", "Susanto", "Tanjung", "Utomo", "Wijaya",
];

const TEACHER_MALE_FIRST = [
  "Ahmad", "Bambang", "Cahyo", "Dedi", "Eko", "Fajar",
  "Gunawan", "Hendra", "Imam", "Joko", "Kurniawan", "Lukman",
];

const TEACHER_FEMALE_FIRST = [
  "Ratna", "Sari", "Dewi", "Nurul", "Rina", "Maya",
  "Siti", "Anisa", "Fitri", "Lestari", "Wulan", "Yuni",
];

const TEACHER_LAST = [
  "Santoso", "Wijaya", "Pratama", "Nugroho", "Handayani", "Puspita",
  "Hidayat", "Kusuma", "Ramadhan", "Saputra", "Wulandari", "Utami",
];

const TEACHER_DEGREES = ["M.Pd.", "S.Pd.", "M.Si.", "S.Si.", "S.Kom.", "M.Hum.", "S.E.", "S.Ag."];

function studentName(index: number): string {
  const female = index % 2 === 1;
  const first = female ? FEMALE_FIRST[Math.floor(index / 2) % FEMALE_FIRST.length] : MALE_FIRST[Math.floor(index / 2) % MALE_FIRST.length];
  const middle = MIDDLE_NAMES[Math.floor(index / 60) % MIDDLE_NAMES.length];
  const last = LAST_NAMES[(index * 7) % LAST_NAMES.length];
  return `${first} ${middle} ${last}`;
}

function teacherIdentity(index: number): { name: string; nig: string } {
  const female = index % 2 === 1;
  const firstPool = female ? TEACHER_FEMALE_FIRST : TEACHER_MALE_FIRST;
  const first = firstPool[Math.floor(index / 2) % firstPool.length];
  const last = TEACHER_LAST[index % TEACHER_LAST.length];
  const honorific = female ? "Dra." : "Drs.";
  const degree = TEACHER_DEGREES[index % TEACHER_DEGREES.length];
  const name = `${honorific} ${first} ${last}, ${degree}`;

  const birthYear = 1968 + (index % 20);
  const birthMonth = String((index % 12) + 1).padStart(2, "0");
  const birthDay = String((index % 27) + 1).padStart(2, "0");
  const appointedYear = 1990 + (index % 20);
  const appointedMonth = String((index % 12) + 1).padStart(2, "0");
  const gender = (index % 2) + 1;
  const serial = String(index + 1).padStart(3, "0");
  const nig = `${birthYear}${birthMonth}${birthDay}${appointedYear}${appointedMonth}${gender}${serial}`;

  return { name, nig };
}

/** Bangun 24 kelas (X–XII, 8 per angkatan), 24 wali kelas, dan 720 siswa. */
export function buildAcademicSeed(): {
  homerooms: SeedHomeroom[];
  teachers: SeedTeacher[];
  students: SeedStudent[];
} {
  const homerooms: SeedHomeroom[] = [];
  const teachers: SeedTeacher[] = [];
  const students: SeedStudent[] = [];
  let classIndex = 0;

  for (const grade of GRADES) {
    const roman = GRADE_ROMAN[grade];
    for (let classNumber = 1; classNumber <= CLASSES_PER_GRADE; classNumber += 1) {
      const homeroomId = `${roman}.${classNumber}`;
      const room = `Ruang ${homeroomId}`;
      const identity = teacherIdentity(classIndex);

      const teacherId = `wali-${String(classIndex + 1).padStart(2, "0")}`;
      const subject = SUBJECTS[classIndex % SUBJECTS.length];
      const portraitIndex = (classIndex * 7) % 80;
      const photo = `https://randomuser.me/api/portraits/${classIndex % 2 === 0 ? "men" : "women"}/${portraitIndex}.jpg`;

      teachers.push({
        id: teacherId,
        name: identity.name,
        nig: identity.nig,
        subject,
        position: `Wali Kelas ${homeroomId}`,
        photo,
        homeroomId,
        homeroomName: homeroomId,
        room,
      });

      homerooms.push({
        id: homeroomId,
        grade,
        name: homeroomId,
        teacherId,
        teacherName: identity.name,
        room,
        sort: classIndex,
      });

      for (let studentNumber = 1; studentNumber <= STUDENTS_PER_CLASS; studentNumber += 1) {
        const globalIndex = classIndex * STUDENTS_PER_CLASS + (studentNumber - 1);
        students.push({
          id: `siswa-${grade}-${classNumber}-${studentNumber}`,
          name: studentName(globalIndex),
          nisn: `0068${grade}${String(classNumber).padStart(2, "0")}${String(studentNumber).padStart(2, "0")}`,
          className: homeroomId,
        });
      }

      classIndex += 1;
    }
  }

  return { homerooms, teachers, students };
}

const SCHEDULE_SLOTS: { day: string; start: string; end: string; subject: string; room: string }[] = [
  { day: "Senin", start: "07.00", end: "08.00", subject: "Upacara Bendera", room: "Lapangan" },
  { day: "Senin", start: "08.00", end: "09.30", subject: "Matematika", room: "Ruang Kelas" },
  { day: "Senin", start: "10.00", end: "11.30", subject: "Bahasa Indonesia", room: "Ruang Kelas" },
  { day: "Senin", start: "13.00", end: "14.30", subject: "Fisika", room: "Lab IPA" },
  { day: "Selasa", start: "07.15", end: "08.45", subject: "Kimia", room: "Lab IPA" },
  { day: "Selasa", start: "09.00", end: "10.30", subject: "Bahasa Inggris", room: "Ruang Kelas" },
  { day: "Selasa", start: "11.00", end: "12.30", subject: "Biologi", room: "Lab IPA" },
  { day: "Selasa", start: "13.30", end: "15.00", subject: "Informatika", room: "Lab Komputer" },
  { day: "Rabu", start: "07.15", end: "08.45", subject: "Matematika", room: "Ruang Kelas" },
  { day: "Rabu", start: "09.00", end: "10.30", subject: "Sejarah", room: "Ruang Kelas" },
  { day: "Rabu", start: "11.00", end: "12.30", subject: "PPKn", room: "Ruang Kelas" },
  { day: "Rabu", start: "13.30", end: "15.00", subject: "Sosiologi", room: "Ruang Kelas" },
  { day: "Kamis", start: "07.15", end: "08.45", subject: "Bahasa Inggris", room: "Ruang Kelas" },
  { day: "Kamis", start: "09.00", end: "10.30", subject: "Ekonomi", room: "Ruang Kelas" },
  { day: "Kamis", start: "11.00", end: "12.30", subject: "Geografi", room: "Ruang Kelas" },
  { day: "Jumat", start: "07.00", end: "08.00", subject: "Pendidikan Jasmani", room: "Lapangan" },
  { day: "Jumat", start: "08.00", end: "09.30", subject: "Seni Budaya", room: "Ruang Kesenian" },
  { day: "Jumat", start: "10.00", end: "11.30", subject: "Bahasa Indonesia", room: "Ruang Kelas" },
];

const DIGITAL_COLORS = ["bg-brand-pine", "bg-brand-green", "bg-brand-green-deep"];

/** Jadwal pelajaran sepekan untuk seluruh rombel. */
export function buildScheduleSeed(academic: {
  homerooms: SeedHomeroom[];
  teachers: SeedTeacher[];
}): SeedScheduleSlot[] {
  const teachersBySubject = new Map<string, SeedTeacher[]>();
  for (const teacher of academic.teachers) {
    const list = teachersBySubject.get(teacher.subject) ?? [];
    list.push(teacher);
    teachersBySubject.set(teacher.subject, list);
  }

  const slots: SeedScheduleSlot[] = [];
  academic.homerooms.forEach((homeroom, classIndex) => {
    SCHEDULE_SLOTS.forEach((slot, slotIndex) => {
      const candidates = teachersBySubject.get(slot.subject);
      const teacher = candidates && candidates.length > 0
        ? candidates[(classIndex + slotIndex) % candidates.length].name
        : homeroom.teacherName;
      slots.push({
        id: `sched-${homeroom.id.replace(".", "-")}-${slotIndex + 1}`,
        day: slot.day,
        start: slot.start,
        end: slot.end,
        subject: slot.subject,
        className: homeroom.name,
        room: slot.room === "Ruang Kelas" ? homeroom.room : slot.room,
        teacher,
        sort: slotIndex,
      });
    });
  });
  return slots;
}

/** Satu kelas digital per rombel, lengkap dengan anggota, pengumuman, dan tugas pertama. */
export function buildDigitalSeed(academic: {
  homerooms: SeedHomeroom[];
  teachers: SeedTeacher[];
  students: SeedStudent[];
}): {
  classes: SeedDigitalClass[];
  members: SeedDigitalMember[];
  posts: SeedDigitalPost[];
  assignments: SeedDigitalAssignment[];
  submissions: SeedDigitalSubmission[];
} {
  const classes: SeedDigitalClass[] = [];
  const members: SeedDigitalMember[] = [];
  const posts: SeedDigitalPost[] = [];
  const assignments: SeedDigitalAssignment[] = [];
  const submissions: SeedDigitalSubmission[] = [];

  academic.homerooms.forEach((homeroom, index) => {
    const teacher = academic.teachers[index];
    const classId = `walikelas-${homeroom.id.replace(".", "-")}`;
    classes.push({
      id: classId,
      name: `Kelas ${homeroom.name}`,
      subject: teacher?.subject ?? "Wali Kelas",
      section: homeroom.name,
      room: homeroom.room,
      code: `WALI-${homeroom.id.replace(".", "")}`,
      teacherName: homeroom.teacherName,
      color: DIGITAL_COLORS[index % DIGITAL_COLORS.length],
      description: `Kelas digital wali kelas ${homeroom.name} — ${homeroom.teacherName}.`,
    });

    const roster = academic.students.filter((student) => student.className === homeroom.name);
    for (const student of roster) {
      members.push({ classId, studentId: student.id });
    }

    posts.push({
      id: `post-${classId}`,
      classId,
      authorName: homeroom.teacherName,
      content: `Selamat datang di kelas digital ${homeroom.name}! Gunakan ruang ini untuk melihat materi, tugas, dan pengumuman kelas. Jangan ragu bertanya di kolom komentar.`,
    });

    const assignmentId = `asg-${classId}`;
    assignments.push({
      id: assignmentId,
      classId,
      title: "Kontrak Belajar & Perkenalan Diri",
      instructions:
        "Tulis perkenalan singkat (nama, asal SMP, minat belajar, dan target semester ini) lalu unggah tautan dokumen. Sertakan juga kesepakatan belajar kelas.",
      topic: "Orientasi",
      dueLabel: "7 hari lagi",
      dueAtIso: new Date(Date.now() + 7 * 86400000).toISOString(),
      points: 100,
    });
    for (const student of roster) {
      submissions.push({
        id: `${assignmentId}-${student.id}`,
        assignmentId,
        studentId: student.id,
        status: "assigned",
      });
    }
  });

  return { classes, members, posts, assignments, submissions };
}
