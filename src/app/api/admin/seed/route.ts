import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { dbConfigured, getDb } from "@/lib/db";
import { schoolData } from "@/lib/school-data";
import { newsArticles } from "@/lib/news";
import {
  achievements,
  facilities,
  facilityHighlights,
  faqs,
  galleryAlbums,
  galleryPhotos,
  peoplePhotos,
  ppdbFees,
  ppdbSchedule,
  ppdbScholarships,
  ppdbSteps,
  teachers,
  testimonials,
} from "@/lib/content";
import { ekskulList } from "@/lib/ekskul";
import { orgMembers, orgUnits } from "@/lib/struktur-organisasi";
import { buildAcademicSeed, buildDigitalSeed, buildScheduleSeed } from "@/lib/akademik";
import { hashPassword } from "@/lib/auth";
import { ADMIN_NPSN } from "@/lib/auth-constants";
import { classInitials } from "@/lib/classroom";
import {
  alumniCareer,
  alumniCities,
  universityLocations,
  universityLogos,
  universityShortNames,
} from "@/lib/alumni-career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Migrasi data statis ke Neon. Idempoten (upsert), aman dijalankan berulang.
 * POST /api/admin/seed  header: x-seed-secret: <SEED_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SEED_SECRET belum diisi di environment." }, { status: 503 });
  }
  const provided = request.headers.get("x-seed-secret") ?? "";
  const providedBuffer = Buffer.from(provided);
  const secretBuffer = Buffer.from(secret);
  const authorized =
    providedBuffer.length === secretBuffer.length && timingSafeEqual(providedBuffer, secretBuffer);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL belum diisi." }, { status: 503 });
  }

  const sql = getDb();
  const counts: Record<string, number> = {};

  /**
   * Berita yang membahas achievement/ekskul tertentu. Dipakai supaya
   * halaman /kehidupan/ekskul bisa menautkan prestasinya ke artikelnya.
   */
  const NEWS_ENTITY_LINKS: Record<string, { ekskulId?: string; achievementId?: string }> = {
    "tim-robotika-juara-1-nasional": { ekskulId: "ivratix", achievementId: "11" },
    "festival-seni-sman-68": { ekskulId: "mbrass", achievementId: "3" },
    "workshop-ai-alumni-google": { ekskulId: "nest-esport" },
  };

  /* ------------------------------- Sekolah ------------------------------- */
  const identitas = schoolData.identitas;
  const kontak = schoolData.kontak;
  await sql`
    insert into school_profile (
      id, nama, npsn, akreditasi, skor_akreditasi, tahun_berdiri,
      alamat, telepon, telepon_href, email, email_href, maps_url,
      visi, misi, stats, socials, updated_at
    ) values (
      'default', ${identitas.namaBersih}, ${identitas.npsn}, ${identitas.akreditasi},
      ${String(identitas.skorAkreditasi)}, ${identitas.tahunBerdiri},
      ${kontak.alamat}, ${kontak.telepon}, ${kontak.teleponHref},
      ${kontak.email}, ${kontak.emailHref}, ${kontak.mapsUrl},
      ${"Unggul dalam prestasi, teguh dalam karakter."},
      ${JSON.stringify([])}::jsonb,
      ${JSON.stringify({ siswa: schoolData.siswa, ptk: schoolData.ptk, sarana: schoolData.sarana })}::jsonb,
      ${JSON.stringify({ website: kontak.website })}::jsonb,
      now()
    )
    on conflict (id) do update set
      nama = excluded.nama, npsn = excluded.npsn, akreditasi = excluded.akreditasi,
      skor_akreditasi = excluded.skor_akreditasi, tahun_berdiri = excluded.tahun_berdiri,
      alamat = excluded.alamat, telepon = excluded.telepon, telepon_href = excluded.telepon_href,
      email = excluded.email, email_href = excluded.email_href, maps_url = excluded.maps_url,
      stats = excluded.stats, socials = excluded.socials, updated_at = now()
  `;
  counts.school_profile = 1;

  for (const row of schoolData.akreditasiRiwayat) {
    await sql`
      insert into accreditations (tahun, peringkat, skor, keterangan)
      values (${row.tahun}, ${"A"}, ${String(row.skor)}, ${row.sk})
      on conflict (tahun, peringkat) do update set skor = excluded.skor, keterangan = excluded.keterangan
    `;
  }
  counts.accreditations = schoolData.akreditasiRiwayat.length;

  /* -------------------------------- Berita -------------------------------- */
  for (const article of newsArticles) {
    const link = NEWS_ENTITY_LINKS[article.slug] ?? {};
    await sql`
      insert into news (
        slug, title, excerpt, content, category, author, cover_key, views,
        status, published_at, ekskul_id, achievement_id
      ) values (
        ${article.slug}, ${article.title}, ${article.excerpt}, ${article.content},
        ${article.category}, ${article.author}, ${article.cover}, ${0},
        ${"published"}, ${article.publishedAt},
        ${link.ekskulId ?? null}, ${link.achievementId ?? null}
      )
      on conflict (slug) do update set
        title = excluded.title, excerpt = excluded.excerpt, content = excluded.content,
        category = excluded.category, author = excluded.author, cover_key = excluded.cover_key,
        status = excluded.status, published_at = excluded.published_at,
        ekskul_id = excluded.ekskul_id, achievement_id = excluded.achievement_id
    `;
  }
  counts.news = newsArticles.length;

  /* ------------------------------ Prestasi ------------------------------- */
  for (const item of achievements) {
    await sql`
      insert into achievements (
        id, title, description, level, category, award_type, year, cover_key,
        participants, ekskul_id, status
      ) values (
        ${item.id}, ${item.title}, ${item.description}, ${item.level}, ${item.category},
        ${item.awardType}, ${item.year}, ${item.cover},
        ${JSON.stringify(item.participants ?? [])}::jsonb,
        ${item.ekskulId ?? null}, ${"published"}
      )
      on conflict (id) do update set
        title = excluded.title, description = excluded.description, level = excluded.level,
        category = excluded.category, award_type = excluded.award_type, year = excluded.year,
        cover_key = excluded.cover_key, participants = excluded.participants,
        ekskul_id = excluded.ekskul_id
    `;
  }
  counts.achievements = achievements.length;

  /* ------------------------------- Galeri -------------------------------- */
  for (let i = 0; i < galleryAlbums.length; i += 1) {
    const album = galleryAlbums[i];
    await sql`
      insert into gallery_albums (id, title, category, cover_key, sort)
      values (${album.id}, ${album.title}, ${album.category}, ${album.cover}, ${i})
      on conflict (id) do update set
        title = excluded.title, category = excluded.category,
        cover_key = excluded.cover_key, sort = excluded.sort
    `;
  }
  /* Seed versi lama menambah foto berulang; bersihkan baris kembar sebelum isi ulang. */
  await sql`
    delete from gallery_photos gp
    using gallery_photos dup
    where gp.ctid < dup.ctid
      and gp.album_id is not distinct from dup.album_id
      and gp.image_key = dup.image_key
      and gp.caption is not distinct from dup.caption
  `;
  for (let i = 0; i < galleryPhotos.length; i += 1) {
    const photo = galleryPhotos[i];
    await sql`
      insert into gallery_photos (album_id, image_key, caption, sort)
      select ${photo.albumId ?? null}, ${photo.src}, ${photo.caption}, ${i}
      where not exists (
        select 1 from gallery_photos
        where album_id is not distinct from ${photo.albumId ?? null}
          and image_key = ${photo.src}
          and caption is not distinct from ${photo.caption}
      )
    `;
  }
  counts.gallery_albums = galleryAlbums.length;
  counts.gallery_photos = galleryPhotos.length;

  /* ------------------------------ Fasilitas ------------------------------ */
  for (let i = 0; i < facilities.length; i += 1) {
    const room = facilities[i];
    await sql`
      insert into facilities (id, name, category, floor, building, capacity, description, images, sort)
      values (
        ${room.id}, ${room.name}, ${room.category}, ${room.floor},
        ${room.building ?? null}, ${room.capacity ?? null}, ${room.description ?? null},
        ${JSON.stringify(room.images ?? [])}::jsonb, ${i}
      )
      on conflict (id) do update set
        name = excluded.name, category = excluded.category, floor = excluded.floor,
        building = excluded.building, capacity = excluded.capacity,
        description = excluded.description, images = excluded.images, sort = excluded.sort
    `;
  }
  /* Buang ruangan lama yang tidak lagi ada di data statis (mis. musholla/osis/lab-bahasa). */
  const facilityIds = facilities.map((room) => room.id);
  await sql`delete from facilities where id <> all(${facilityIds}::text[])`;
  counts.facilities = facilities.length;

  /* ------------------------ Hero, highlight, foto ------------------------- */
  const heroSeeds = [
    { id: "hero-1", image: "/assets/hero-4.jpeg", alt: "Bazkom Seranoua SMAN 68 Jakarta", caption: "Bazkom Seranoua 2024" },
    { id: "hero-2", image: "/assets/hero-1.png", alt: "Kegiatan siswa SMAN 68 Jakarta", caption: "Kegiatan belajar siswa" },
    { id: "hero-3", image: "/assets/hero-2.png", alt: "Prestasi siswa SMAN 68 Jakarta", caption: "Prestasi siswa" },
    { id: "hero-4", image: "/assets/hero-3.png", alt: "Apel pembinaan SMAN 68 Jakarta", caption: "Apel pembinaan" },
    { id: "hero-5", image: "/assets/foto-2.webp", alt: "Semangat siswa SMAN 68 Jakarta", caption: "Kebersamaan siswa" },
  ];
  for (let i = 0; i < heroSeeds.length; i += 1) {
    const slide = heroSeeds[i];
    await sql`
      insert into hero_slides (id, image_key, alt, caption, sort)
      values (${slide.id}, ${slide.image}, ${slide.alt}, ${slide.caption}, ${i})
      on conflict (id) do update set
        image_key = excluded.image_key, alt = excluded.alt,
        caption = excluded.caption, sort = excluded.sort
    `;
  }
  counts.hero_slides = heroSeeds.length;

  for (let i = 0; i < facilityHighlights.length; i += 1) {
    const highlight = facilityHighlights[i];
    await sql`
      insert into facility_highlights (id, title, description, image_key, sort)
      values (${highlight.id}, ${highlight.title}, ${highlight.description}, ${highlight.image}, ${i})
      on conflict (id) do update set
        title = excluded.title, description = excluded.description,
        image_key = excluded.image_key, sort = excluded.sort
    `;
  }
  counts.facility_highlights = facilityHighlights.length;

  for (let i = 0; i < peoplePhotos.length; i += 1) {
    const photo = peoplePhotos[i];
    await sql`
      insert into people_photos (id, image_key, alt, sort)
      values (${`people-${i + 1}`}, ${photo.src}, ${photo.alt}, ${i})
      on conflict (id) do update set
        image_key = excluded.image_key, alt = excluded.alt, sort = excluded.sort
    `;
  }
  counts.people_photos = peoplePhotos.length;

  /* -------------------------------- Guru --------------------------------- */
  for (let i = 0; i < teachers.length; i += 1) {
    const teacher = teachers[i];
    await sql`
      insert into teachers (id, name, subject, position, photo_key, email, sort)
      values (
        ${teacher.id}, ${teacher.name}, ${teacher.subject}, ${teacher.position},
        ${teacher.photo}, ${teacher.email ?? null}, ${i}
      )
      on conflict (id) do update set
        name = excluded.name, subject = excluded.subject, position = excluded.position,
        photo_key = excluded.photo_key, email = excluded.email, sort = excluded.sort
    `;
  }
  counts.teachers = teachers.length;

  /* ------------------- Rombel, siswa, wali kelas & akun ------------------- */
  const academic = buildAcademicSeed();

  const teacherRows = academic.teachers.map((teacher, index) => ({
    id: teacher.id,
    name: teacher.name,
    subject: teacher.subject,
    position: teacher.position,
    photo_key: teacher.photo,
    nig: teacher.nig,
    sort: index,
  }));
  await sql`
    insert into teachers (id, name, subject, position, photo_key, email, sort, nig)
    select x.id, x.name, x.subject, x.position, x.photo_key, null, x.sort, x.nig
    from jsonb_to_recordset(${JSON.stringify(teacherRows)}::jsonb) as x(
      id text, name text, subject text, position text, photo_key text, sort integer, nig text
    )
    on conflict (id) do update set
      name = excluded.name, subject = excluded.subject, position = excluded.position,
      photo_key = excluded.photo_key, nig = excluded.nig
  `;

  const homeroomRows = academic.homerooms.map((homeroom) => ({
    id: homeroom.id,
    grade: homeroom.grade,
    name: homeroom.name,
    teacher_id: homeroom.teacherId,
    teacher_name: homeroom.teacherName,
    room: homeroom.room,
    sort: homeroom.sort,
  }));
  await sql`
    insert into homeroom_classes (id, grade, name, teacher_id, teacher_name, room, sort)
    select x.id, x.grade, x.name, x.teacher_id, x.teacher_name, x.room, x.sort
    from jsonb_to_recordset(${JSON.stringify(homeroomRows)}::jsonb) as x(
      id text, grade integer, name text, teacher_id text, teacher_name text, room text, sort integer
    )
    on conflict (id) do update set
      grade = excluded.grade, name = excluded.name, teacher_id = excluded.teacher_id,
      teacher_name = excluded.teacher_name, room = excluded.room, sort = excluded.sort
  `;

  const studentRows = academic.students.map((student) => ({
    id: student.id,
    name: student.name,
    class_name: student.className,
    nisn: student.nisn,
  }));
  await sql`
    insert into students (id, name, class_name, nisn)
    select x.id, x.name, x.class_name, x.nisn
    from jsonb_to_recordset(${JSON.stringify(studentRows)}::jsonb) as x(
      id text, name text, class_name text, nisn text
    )
    on conflict (id) do update set
      name = excluded.name, class_name = excluded.class_name, nisn = excluded.nisn
  `;

  // Hash hanya untuk akun baru â€” akun existing mempertahankan password-nya
  // (menghindari 745 hash scrypt setiap kali seed dijalankan).
  const existingAccountRows = (await sql`select username from accounts`) as { username: string }[];
  const existingUsernames = new Set(existingAccountRows.map((row) => String(row.username)));

  const baseAccounts = [
    ...academic.students.map((student) => ({
      username: student.nisn,
      role: "student",
      name: student.name,
      detail: student.className,
      student_id: student.id,
      teacher_id: null as string | null,
    })),
    ...academic.teachers.map((teacher) => ({
      username: teacher.nig,
      role: "teacher",
      name: teacher.name,
      detail: `Wali Kelas ${teacher.homeroomName} Â· ${teacher.subject}`,
      student_id: null as string | null,
      teacher_id: teacher.id,
    })),
    {
      username: ADMIN_NPSN,
      role: "admin",
      name: "Administrator SMAN 68 Jakarta",
      detail: "Super Admin",
      student_id: null as string | null,
      teacher_id: null as string | null,
    },
  ];
  const accountRows = await Promise.all(
    baseAccounts.map(async (account) => ({
      ...account,
      password_hash: existingUsernames.has(account.username) ? "" : await hashPassword(account.username),
    }))
  );

  await sql`
    insert into accounts (username, password_hash, role, name, detail, student_id, teacher_id, status)
    select x.username, x.password_hash, x.role, x.name, x.detail, x.student_id, x.teacher_id, 'Aktif'
    from jsonb_to_recordset(${JSON.stringify(accountRows)}::jsonb) as x(
      username text, password_hash text, role text, name text, detail text,
      student_id text, teacher_id text
    )
    on conflict (username) do update set
      role = excluded.role, name = excluded.name,
      detail = excluded.detail, student_id = excluded.student_id,
      teacher_id = excluded.teacher_id, status = excluded.status
  `;

  counts.homeroom_classes = academic.homerooms.length;
  counts.students_baru = academic.students.length;
  counts.wali_kelas = academic.teachers.length;
  counts.accounts = accountRows.length;

  /* ------------------- Kelas digital per rombel (wali kelas) -------------- */
  const digital = buildDigitalSeed(academic);

  const digitalClasses = digital.classes.map((item) => ({
    id: item.id,
    name: item.name,
    subject: item.subject,
    section: item.section,
    room: item.room,
    code: item.code,
    teacher_name: item.teacherName,
    teacher_initials: classInitials(item.teacherName),
    color: item.color,
    description: item.description,
  }));
  await sql`
    insert into classes (
      id, name, subject, section, room, code, teacher_name, teacher_initials, color, description
    )
    select x.id, x.name, x.subject, x.section, x.room, x.code, x.teacher_name,
           x.teacher_initials, x.color, x.description
    from jsonb_to_recordset(${JSON.stringify(digitalClasses)}::jsonb) as x(
      id text, name text, subject text, section text, room text, code text,
      teacher_name text, teacher_initials text, color text, description text
    )
    on conflict (id) do update set
      name = excluded.name, subject = excluded.subject, section = excluded.section,
      room = excluded.room, code = excluded.code, teacher_name = excluded.teacher_name,
      teacher_initials = excluded.teacher_initials, color = excluded.color,
      description = excluded.description
  `;

  const digitalMembers = digital.members.map((item) => ({
    class_id: item.classId,
    student_id: item.studentId,
  }));
  await sql`
    insert into class_members (class_id, student_id, enrolled)
    select x.class_id, x.student_id, true
    from jsonb_to_recordset(${JSON.stringify(digitalMembers)}::jsonb) as x(
      class_id text, student_id text
    )
    on conflict (class_id, student_id) do update set enrolled = true
  `;

  const digitalPosts = digital.posts.map((item) => ({
    id: item.id,
    class_id: item.classId,
    author_name: item.authorName,
    initials: classInitials(item.authorName),
    content: item.content,
    kind: "announcement",
    created_at: new Date(Date.now() - 1800000).toISOString(),
  }));
  await sql`
    insert into class_posts (id, class_id, author_name, initials, content, kind, created_at)
    select x.id, x.class_id, x.author_name, x.initials, x.content, x.kind, x.created_at
    from jsonb_to_recordset(${JSON.stringify(digitalPosts)}::jsonb) as x(
      id text, class_id text, author_name text, initials text, content text,
      kind text, created_at timestamptz
    )
    on conflict (id) do update set
      content = excluded.content, kind = excluded.kind
  `;

  const digitalAssignments = digital.assignments.map((item) => ({
    id: item.id,
    class_id: item.classId,
    title: item.title,
    instructions: item.instructions,
    topic: item.topic,
    due_at: item.dueAtIso,
    due_label: item.dueLabel,
    points: item.points,
  }));
  await sql`
    insert into class_assignments (
      id, class_id, title, instructions, topic, due_at, due_label, points
    )
    select x.id, x.class_id, x.title, x.instructions, x.topic, x.due_at, x.due_label, x.points
    from jsonb_to_recordset(${JSON.stringify(digitalAssignments)}::jsonb) as x(
      id text, class_id text, title text, instructions text, topic text,
      due_at timestamptz, due_label text, points integer
    )
    on conflict (id) do update set
      title = excluded.title, instructions = excluded.instructions, topic = excluded.topic,
      due_at = excluded.due_at, due_label = excluded.due_label, points = excluded.points
  `;

  const digitalSubmissions = digital.submissions.map((item) => ({
    id: item.id,
    assignment_id: item.assignmentId,
    student_id: item.studentId,
    status: item.status,
  }));
  await sql`
    insert into class_submissions (id, assignment_id, student_id, status)
    select x.id, x.assignment_id, x.student_id, x.status
    from jsonb_to_recordset(${JSON.stringify(digitalSubmissions)}::jsonb) as x(
      id text, assignment_id text, student_id text, status text
    )
    on conflict (assignment_id, student_id) do nothing
  `;

  counts.kelas_digital = digital.classes.length;
  counts.anggota_kelas = digital.members.length;
  counts.post_kelas = digital.posts.length;
  counts.tugas_kelas = digital.assignments.length;
  counts.pengumpulan_tugas = digital.submissions.length;

  /* ------------------------------ Testimoni ------------------------------ */
  for (let i = 0; i < testimonials.length; i += 1) {
    const item = testimonials[i];
    await sql`
      insert into testimonials (id, name, role, quote, photo_key, sort)
      values (${item.id}, ${item.name}, ${item.role}, ${item.quote}, ${item.photo}, ${i})
      on conflict (id) do update set
        name = excluded.name, role = excluded.role, quote = excluded.quote,
        photo_key = excluded.photo_key, sort = excluded.sort
    `;
  }
  counts.testimonials = testimonials.length;

  /* --------------------------------- FAQ --------------------------------- */
  for (let i = 0; i < faqs.length; i += 1) {
    const faq = faqs[i];
    await sql`
      insert into faqs (id, question, answer, category, sort)
      values (${faq.id}, ${faq.question}, ${faq.answer}, ${faq.category}, ${i})
      on conflict (id) do update set
        question = excluded.question, answer = excluded.answer,
        category = excluded.category, sort = excluded.sort
    `;
  }
  counts.faqs = faqs.length;

  /* ----------------------------- PPDB config ----------------------------- */
  await sql`
    insert into ppdb_config (id, steps, schedule, fees, scholarships, updated_at)
    values (
      'default',
      ${JSON.stringify(ppdbSteps)}::jsonb,
      ${JSON.stringify(ppdbSchedule)}::jsonb,
      ${JSON.stringify(ppdbFees)}::jsonb,
      ${JSON.stringify(ppdbScholarships)}::jsonb,
      now()
    )
    on conflict (id) do update set
      steps = excluded.steps, schedule = excluded.schedule,
      fees = excluded.fees, scholarships = excluded.scholarships, updated_at = now()
  `;
  counts.ppdb_config = 1;

  /* ---------------------------- Pengumuman ------------------------------- */
  const announcementSeeds = [
    { title: "Ujian Tengah Semester Gasal dimulai 10 November", audience: "student", urgent: true, pinned: true, author: "Admin SMAN 68", hoursAgo: 2 },
    { title: "Pengumpulan berkas proyek karya ilmiah diperpanjang", audience: "student", urgent: false, pinned: false, author: "Ekskul KIR", hoursAgo: 24 },
    { title: "Lomba kebersihan kelas & dekorasi majalah dinding", audience: "student", urgent: false, pinned: false, author: "OSIS", hoursAgo: 72 },
    { title: "Pendaftaran Tryout UTBK Bersama Bimbingan Belajar", audience: "student", urgent: false, pinned: false, author: "Wakasek Kurikulum", hoursAgo: 96 },
    { title: "Rapat Koordinasi Ujian Tengah Semester â€” Jumat 14.00", audience: "teacher", urgent: true, pinned: false, author: "Wakasek Kurikulum", hoursAgo: 2 },
    { title: "Batas Akhir Input Nilai Rapor Siswa Kelas X & XI", audience: "teacher", urgent: false, pinned: false, author: "Tata Usaha", hoursAgo: 24 },
    { title: "Sosialisasi Modul Ajar Kurikulum Merdeka Terintegrasi", audience: "teacher", urgent: false, pinned: false, author: "Tim Pengembang Kurikulum", hoursAgo: 72 },
  ];
  const existingAnnouncements = (await sql`select count(*)::int as count from announcements`) as { count: number }[];
  if ((existingAnnouncements[0]?.count as number) === 0) {
    for (const item of announcementSeeds) {
      await sql`
        insert into announcements (title, audience, urgent, pinned, author, status, published_at)
        values (${item.title}, ${item.audience}, ${item.urgent}, ${item.pinned},
                ${item.author}, ${"published"}, now() - (${item.hoursAgo} || ' hours')::interval)
      `;
    }
  }
  counts.announcements = announcementSeeds.length;

  /* ---------------------------- Notifikasi ------------------------------- */
  const notificationSeeds = [
    { title: "Jadwal UTS Gasal telah diterbitkan", minutesAgo: 10, unread: true },
    { title: "Pengumuman kegiatan Porseni pekan depan", minutesAgo: 120, unread: true },
    { title: "Verifikasi prestasi robotika disetujui", minutesAgo: 1440, unread: false },
  ];
  const existingNotifications = (await sql`select count(*)::int as count from notifications`) as { count: number }[];
  if ((existingNotifications[0]?.count as number) === 0) {
    for (const item of notificationSeeds) {
      await sql`
        insert into notifications (title, unread, created_at)
        values (${item.title}, ${item.unread}, now() - (${item.minutesAgo} || ' minutes')::interval)
      `;
    }
  }
  counts.notifications = notificationSeeds.length;

  /* ------------------------------ Jadwal ---------------------------------- */
  const scheduleRows = buildScheduleSeed(academic).map((slot) => ({
    id: slot.id,
    day: slot.day,
    start_time: slot.start,
    end_time: slot.end,
    subject: slot.subject,
    class_name: slot.className,
    room: slot.room,
    teacher: slot.teacher,
    audience: "student",
    sort: slot.sort,
  }));
  await sql`delete from class_schedules where audience = 'student'`;
  await sql`
    insert into class_schedules (
      id, day, start_time, end_time, subject, class_name, room, teacher, audience, sort
    )
    select x.id, x.day, x.start_time, x.end_time, x.subject, x.class_name,
           x.room, x.teacher, x.audience, x.sort
    from jsonb_to_recordset(${JSON.stringify(scheduleRows)}::jsonb) as x(
      id text, day text, start_time text, end_time text, subject text,
      class_name text, room text, teacher text, audience text, sort integer
    )
    on conflict (id) do update set
      day = excluded.day, start_time = excluded.start_time, end_time = excluded.end_time,
      subject = excluded.subject, class_name = excluded.class_name, room = excluded.room,
      teacher = excluded.teacher, audience = excluded.audience, sort = excluded.sort
  `;
  counts.class_schedules = scheduleRows.length;

  /* --------------------------- Users & moderasi --------------------------- */
  const profileSeeds = [
    { name: "Rafi Ahmad Pratama", email: "rafi.ahmad@sman68.sch.id", role: "student", detail: "Kelas XI IPA 3", status: "Aktif" },
    { name: "Drs. Ahmad Fauzi, M.Pd.", email: "a.fauzi@sman68.sch.id", role: "teacher", detail: "Matematika", status: "Aktif" },
    { name: "Budi Santoso, S.Pd.", email: "budi.santoso@sman68.sch.id", role: "teacher", detail: "Matematika Peminatan", status: "Aktif" },
    { name: "Admin IT", email: "admin@sman68.sch.id", role: "admin", detail: "Super Admin", status: "Aktif" },
    { name: "Kevin Pratama", email: "kevin.p@sman68.sch.id", role: "student", detail: "Kelas XII IPA 1", status: "Nonaktif" },
  ];
  for (const profile of profileSeeds) {
    await sql`
      insert into profiles (full_name, email, role, detail, status)
      values (${profile.name}, ${profile.email}, ${profile.role}, ${profile.detail}, ${profile.status})
      on conflict (email) do update set
        full_name = excluded.full_name, role = excluded.role,
        detail = excluded.detail, status = excluded.status
    `;
  }
  counts.profiles = profileSeeds.length;

  const moderationSeeds = [
    { id: "p1", type: "Berita", title: "Hasil Kompetisi Robotika Nasional", author: "Pak Eko", hoursAgo: 1 },
    { id: "p2", type: "Pengumuman", title: "Jadwal Libur Awal Ramadhan", author: "Admin TU", hoursAgo: 3 },
    { id: "p3", type: "Prestasi", title: "Juara 1 Debat Bahasa Inggris Kota", author: "Bu Nurul", hoursAgo: 24 },
  ];
  for (const item of moderationSeeds) {
    await sql`
      insert into moderation_queue (id, type, title, author, status, created_at)
      values (${item.id}, ${item.type}, ${item.title}, ${item.author}, ${"pending"},
              now() - (${item.hoursAgo} || ' hours')::interval)
      on conflict (id) do update set type = excluded.type, title = excluded.title,
        author = excluded.author
    `;
  }
  counts.moderation_queue = moderationSeeds.length;

  /* ------------------------------- Ekskul -------------------------------- */
  for (const item of ekskulList) {
    await sql`
      insert into extracurriculars (
        id, name, category, logo_key, thumb_key, members, achievements,
        description, schedule, advisor, sort
      ) values (
        ${item.id}, ${item.name}, ${item.category}, ${item.logo}, ${item.thumb},
        ${item.members}, ${item.achievements}, ${item.desc}, ${item.schedule}, ${item.advisor},
        ${ekskulList.indexOf(item)}
      )
      on conflict (id) do update set
        name = excluded.name, category = excluded.category, logo_key = excluded.logo_key,
        thumb_key = excluded.thumb_key, members = excluded.members,
        achievements = excluded.achievements, description = excluded.description,
        schedule = excluded.schedule, advisor = excluded.advisor, sort = excluded.sort
    `;
  }
  counts.extracurriculars = ekskulList.length;

  /* ------------------------- Struktur Organisasi ------------------------- */
  // Unit diurutkan dari atas ke bawah supaya parent_id selalu sudah ada
  // (kepsek -> wakil -> guru), lalu anggota menyusul per unit.
  for (const unit of orgUnits) {
    await sql`
      insert into org_units (id, name, kind, parent_id, subject, description, sort)
      values (
        ${unit.id}, ${unit.name}, ${unit.kind}, ${unit.parentId},
        ${unit.subject ?? null}, ${unit.description ?? null}, ${unit.sort}
      )
      on conflict (id) do update set
        name = excluded.name, kind = excluded.kind, parent_id = excluded.parent_id,
        subject = excluded.subject, description = excluded.description, sort = excluded.sort
    `;
  }
  for (const member of orgMembers) {
    await sql`
      insert into org_members (id, unit_id, name, position, alumni, photo_key, sort)
      values (
        ${member.id}, ${member.unitId}, ${member.name}, ${member.position},
        ${member.alumni}, ${member.photo}, ${member.sort}
      )
      on conflict (id) do update set
        unit_id = excluded.unit_id, name = excluded.name, position = excluded.position,
        alumni = excluded.alumni, photo_key = excluded.photo_key, sort = excluded.sort
    `;
  }
  counts.org_units = orgUnits.length;
  counts.org_members = orgMembers.length;
  /* ------------------------------- Alumni -------------------------------- */
  for (const city of alumniCities) {
    await sql`
      insert into cities (id, name, province, lat, lng)
      values (${city.id}, ${city.name}, ${city.region}, ${city.lat}, ${city.lng})
      on conflict (id) do update set
        name = excluded.name, province = excluded.province, lat = excluded.lat, lng = excluded.lng
    `;
  }
  counts.cities = alumniCities.length;

  for (const [name, short] of Object.entries(universityShortNames)) {
    const id = short.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const location = universityLocations[name];
    await sql`
      insert into universities (id, name, logo_key, lat, lng)
      values (${id}, ${name}, ${universityLogos[name] ?? null}, ${location?.lat ?? null}, ${location?.lng ?? null})
      on conflict (id) do update set
        name = excluded.name, logo_key = excluded.logo_key, lat = excluded.lat, lng = excluded.lng
    `;
  }
  counts.universities = Object.keys(universityShortNames).length;

  for (let index = 0; index < alumniCareer.length; index += 1) {
    const alumni = alumniCareer[index];
    await sql`
      insert into alumni (
        id, name, graduation_year, photo_key, job_title, company, city,
        linkedin_url, story, sort, field, university
      ) values (
        ${alumni.id}, ${alumni.name}, ${Number(alumni.angkatan) || null}, ${alumni.photo},
        ${alumni.role}, ${alumni.company}, ${alumni.cityId}, ${alumni.linkedin}, ${alumni.bio},
        ${index}, ${alumni.field}, ${alumni.university}
      )
      on conflict (id) do update set
        name = excluded.name, graduation_year = excluded.graduation_year,
        photo_key = excluded.photo_key, job_title = excluded.job_title,
        company = excluded.company, city = excluded.city,
        linkedin_url = excluded.linkedin_url, story = excluded.story, sort = excluded.sort,
        field = excluded.field, university = excluded.university
    `;

    const universitySlug = Object.entries(universityShortNames).find(
      ([name]) => name === alumni.university
    );
    const universityId = universitySlug
      ? universitySlug[1].toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : null;

    const existingEducation = (await sql`
      select count(*)::int as count from alumni_educations where alumni_id = ${alumni.id}
    `) as { count: number }[];
    if ((existingEducation[0]?.count as number) === 0) {
      await sql`
        insert into alumni_educations (alumni_id, university_id, major, year)
        values (${alumni.id}, ${universityId}, ${null}, ${Number(alumni.angkatan) || null})
      `;
    }
  }
  counts.alumni = alumniCareer.length;
  counts.alumni_educations = alumniCareer.length;

  revalidatePath("/", "layout");

  return NextResponse.json({
    ok: true,
    message: "Seed selesai. Data statis inti sudah masuk Neon.",
    seeded: counts,
    pending: [
      "news & announcements (masih inline di BeritaList/NewsSection/NewsTicker/[slug]/admin)",
      "achievements (AchievementWall + AchievementSection)",
      "gallery (GaleriView + schoolData.fotoResmi)",
      "teachers/staff (tabel teachers, untuk kebutuhan dashboard)",
      "testimonials (PeopleSection)",
      "faqs & ppdb schedule (PPDBGuide, ppdb/faq, ppdb/biaya)",
      "seluruh file public/assets perlu diunggah ke R2 (scripts/upload-assets-r2.mjs)",
    ],
  });
}
