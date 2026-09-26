-- ============================================================
-- SMAN 68 Jakarta — Neon Postgres schema
-- Jalankan: node scripts/db-init.mjs
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Identitas sekolah
-- ------------------------------------------------------------
create table if not exists school_profile (
  id text primary key default 'default',
  nama text not null,
  npsn text,
  akreditasi text,
  skor_akreditasi text,
  tahun_berdiri integer,
  alamat text,
  telepon text,
  telepon_href text,
  email text,
  email_href text,
  maps_url text,
  jam_layanan text,
  visi text,
  misi jsonb not null default '[]'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  socials jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists accreditations (
  id serial primary key,
  tahun integer not null,
  peringkat text not null,
  skor text,
  keterangan text,
  unique (tahun, peringkat)
);

-- ------------------------------------------------------------
-- Konten publik
-- ------------------------------------------------------------
create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text,
  category text not null default 'Umum',
  author text,
  cover_key text,
  views integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'pending', 'published', 'archived')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_news_published on news (published_at desc) where status = 'published';
create index if not exists idx_news_category on news (category);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  audience text not null default 'all',
  urgent boolean not null default false,
  pinned boolean not null default false,
  author text,
  status text not null default 'published' check (status in ('draft', 'pending', 'published', 'archived')),
  published_at timestamptz not null default now()
);

create table if not exists achievements (
  id text primary key,
  title text not null,
  description text,
  level text not null default 'sekolah',
  category text,
  award_type text,
  year integer,
  cover_key text,
  participants jsonb not null default '[]'::jsonb,
  student_name text,
  status text not null default 'published' check (status in ('pending', 'draft', 'approved', 'published', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists idx_achievements_year on achievements (year desc);

-- Prestasi bisa dimiliki ekskul tertentu, supaya /kehidupan/ekskul bisa
-- menampilkan riwayat prestasinya. Null = prestasi tingkat sekolah.
alter table achievements add column if not exists ekskul_id text;

-- Berita yang membahas sebuah prestasi/ekskul tertentu, supaya
-- daftar prestasi bisa ditautkan ke artikel terkaitnya.
alter table news add column if not exists ekskul_id text;
alter table news add column if not exists achievement_id text;

create index if not exists idx_achievements_ekskul on achievements (ekskul_id);
create index if not exists idx_news_ekskul on news (ekskul_id);

-- Prestasi hasil verifikasi masuk draft dulu (dilengkapi admin sebelum terbit).
alter table achievements drop constraint if exists achievements_status_check;
alter table achievements add constraint achievements_status_check
  check (status in ('pending', 'draft', 'approved', 'published', 'rejected'));

create table if not exists extracurriculars (
  id text primary key,
  name text not null,
  category text not null,
  logo_key text,
  thumb_key text,
  members integer not null default 0,
  achievements integer not null default 0,
  description text,
  schedule text,
  advisor text,
  sort integer not null default 0
);

create table if not exists gallery_albums (
  id text primary key,
  title text not null,
  category text,
  cover_key text,
  taken_at date,
  sort integer not null default 0
);

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id text references gallery_albums (id) on delete cascade,
  image_key text not null,
  caption text,
  sort integer not null default 0
);

-- Bersihkan baris kembar (seed lama menambah tanpa guard) lalu cegah duplikat baru.
delete from gallery_photos gp
using gallery_photos dup
where gp.ctid < dup.ctid
  and gp.album_id is not distinct from dup.album_id
  and gp.image_key = dup.image_key
  and gp.caption is not distinct from dup.caption;

create unique index if not exists idx_gallery_photos_unique
  on gallery_photos (coalesce(album_id, ''), image_key, coalesce(caption, ''));

create table if not exists facilities (
  id text primary key,
  name text not null,
  category text,
  floor text,
  building text,
  capacity integer,
  description text,
  image_key text,
  images jsonb not null default '[]'::jsonb,
  sort integer not null default 0
);

-- Migrasi untuk database yang sudah ada (kolom baru: galeri foto ruangan).
alter table facilities add column if not exists images jsonb not null default '[]'::jsonb;

create table if not exists facility_highlights (
  id text primary key,
  title text not null,
  description text,
  image_key text,
  sort integer not null default 0
);

create table if not exists hero_slides (
  id text primary key,
  image_key text not null,
  alt text,
  caption text,
  sort integer not null default 0
);

create table if not exists people_photos (
  id text primary key,
  image_key text not null,
  alt text,
  sort integer not null default 0
);

create table if not exists testimonials (
  id text primary key,
  name text not null,
  role text,
  quote text not null,
  photo_key text,
  sort integer not null default 0
);

create table if not exists events (
  id text primary key,
  title text not null,
  description text,
  category text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  all_day boolean not null default false,
  audience text not null default 'all'
);
create index if not exists idx_events_start on events (start_at);

create table if not exists faqs (
  id text primary key,
  question text not null,
  answer text not null,
  category text not null default 'umum',
  sort integer not null default 0
);

create table if not exists ppdb_config (
  id text primary key default 'default',
  registration_open_at timestamptz,
  steps jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  fees jsonb not null default '[]'::jsonb,
  scholarships jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Orang: guru, siswa, alumni
-- ------------------------------------------------------------
create table if not exists teachers (
  id text primary key,
  name text not null,
  subject text,
  position text,
  photo_key text,
  email text,
  sort integer not null default 0
);

create table if not exists students (
  id text primary key,
  name text not null,
  class_name text not null default 'XI IPA 3',
  nisn text,
  photo_key text,
  user_id uuid
);

create table if not exists alumni (
  id text primary key,
  name text not null,
  graduation_year integer,
  photo_key text,
  job_title text,
  company text,
  city text,
  linkedin_url text,
  story text,
  sort integer not null default 0
);

alter table alumni add column if not exists field text;
alter table alumni add column if not exists university text;

-- ------------------------------------------------------------
-- Struktur organisasi (kepsek -> wakil -> guru, OSIS, MPK)
-- Pohon disimpan lewat org_units.parent_id. Hanya field yang aman
-- dipublikasikan yang disimpan di sini (nama, jabatan, mapel, wisuda) —
-- NIP/tanggal lahir/kontak pribadi tidak pernah masuk ke tabel ini.
-- ------------------------------------------------------------
create table if not exists org_units (
  id text primary key,
  name text not null,
  kind text not null default 'sekolah' check (kind in ('sekolah', 'osis', 'mpk')),
  parent_id text references org_units (id) on delete set null,
  -- Kelompok mata pelajaran untuk unit jenis 'guru', mis. 'Matematika'.
  subject text,
  description text,
  sort integer not null default 0
);
create index if not exists idx_org_units_parent on org_units (parent_id, sort asc);

create table if not exists org_members (
  id text primary key,
  unit_id text not null references org_units (id) on delete cascade,
  name text not null,
  position text not null,
  -- Riwayat pendidikan/lulusan, mis. 'S1 Pendidikan Matematika — Universitas Indonesia (2005)'.
  alumni text,
  photo_key text,
  sort integer not null default 0
);
create index if not exists idx_org_members_unit on org_members (unit_id, sort asc);

create table if not exists alumni_paths (
  id uuid primary key default gen_random_uuid(),
  alumni_id text not null references alumni (id) on delete cascade,
  year integer,
  title text not null,
  place text,
  sort integer not null default 0
);

create table if not exists cities (
  id text primary key,
  name text not null,
  province text,
  lat double precision,
  lng double precision
);

create table if not exists universities (
  id text primary key,
  name text not null,
  city text,
  logo_key text,
  lat double precision,
  lng double precision
);

create table if not exists alumni_educations (
  id uuid primary key default gen_random_uuid(),
  alumni_id text not null references alumni (id) on delete cascade,
  university_id text references universities (id),
  major text,
  year integer
);

-- ------------------------------------------------------------
-- Absensi (siswa upload foto, wali kelas pilih status)
-- ------------------------------------------------------------
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references students (id) on delete cascade,
  date date not null,
  status text check (status in ('Masuk', 'Izin', 'Sakit', 'Alpa')),
  selfie_key text,
  check_in_time text,
  recorded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, date)
);
create index if not exists idx_attendance_date on attendance (date desc);

-- ------------------------------------------------------------
-- Kelas digital (Google Classroom style)
-- ------------------------------------------------------------
create table if not exists classes (
  id text primary key,
  name text not null,
  subject text,
  section text not null,
  room text,
  code text unique not null,
  teacher_name text not null,
  teacher_initials text,
  color text not null default 'bg-brand-pine',
  description text,
  created_at timestamptz not null default now()
);

create table if not exists class_members (
  class_id text not null references classes (id) on delete cascade,
  student_id text not null references students (id) on delete cascade,
  enrolled boolean not null default true,
  requested_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- Bergabung ke kelas wajib disetujui guru: enrolled=false berarti menunggu ACC.
alter table class_members add column if not exists requested_at timestamptz not null default now();

create table if not exists class_posts (
  id text primary key,
  class_id text not null references classes (id) on delete cascade,
  author_name text not null,
  initials text,
  content text,
  kind text not null default 'announcement' check (kind in ('announcement', 'material')),
  attachment_key text,
  attachment_name text,
  attachment_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_class_posts_class on class_posts (class_id, created_at desc);

create table if not exists class_comments (
  id text primary key,
  post_id text not null references class_posts (id) on delete cascade,
  author_name text not null,
  initials text,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists class_assignments (
  id text primary key,
  class_id text not null references classes (id) on delete cascade,
  title text not null,
  instructions text,
  topic text,
  due_at timestamptz,
  due_label text,
  points integer not null default 100,
  attachment_key text,
  attachment_name text,
  attachment_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_class_assignments_class on class_assignments (class_id, due_at);

create table if not exists class_submissions (
  id text primary key,
  assignment_id text not null references class_assignments (id) on delete cascade,
  student_id text not null references students (id) on delete cascade,
  status text not null default 'assigned' check (status in ('assigned', 'turned_in', 'graded')),
  submitted_at timestamptz,
  drive_url text,
  object_key text,
  grade integer,
  feedback text,
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

-- ------------------------------------------------------------
-- Akun, notifikasi, preferensi
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  full_name text not null,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  avatar_key text,
  detail text,
  status text not null default 'Aktif',
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists detail text;
alter table profiles add column if not exists status text not null default 'Aktif';

create table if not exists moderation_queue (
  id text primary key,
  type text not null,
  title text not null,
  author text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists class_schedules (
  id text primary key,
  day text not null,
  start_time text not null,
  end_time text not null,
  subject text not null,
  class_name text,
  room text,
  teacher text,
  audience text not null default 'student',
  sort integer not null default 0
);

alter table class_schedules add column if not exists audience text not null default 'student';

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  title text not null,
  body text,
  unread boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists user_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Akun login & sesi (username = NISN siswa / NIP guru / NPSN admin)
-- ------------------------------------------------------------
alter table teachers add column if not exists nig text;
create index if not exists idx_teachers_nig on teachers (nig);
create index if not exists idx_students_nisn on students (nisn);

create table if not exists homeroom_classes (
  id text primary key,
  grade integer not null,
  name text not null,
  teacher_id text references teachers (id) on delete set null,
  teacher_name text not null,
  room text,
  sort integer not null default 0
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  name text not null,
  detail text,
  status text not null default 'Aktif',
  student_id text references students (id) on delete cascade,
  teacher_id text references teachers (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_accounts_role on accounts (role);

create table if not exists auth_sessions (
  token text primary key,
  account_id uuid not null references accounts (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now()
);

-- Sesi lama: "terakhir terlihat" diisi waktu pembuatan agar tidak ikut terhitung online.
alter table auth_sessions add column if not exists last_seen_at timestamptz;
update auth_sessions set last_seen_at = created_at where last_seen_at is null;
alter table auth_sessions alter column last_seen_at set default now();
alter table auth_sessions alter column last_seen_at set not null;
create index if not exists idx_auth_sessions_last_seen on auth_sessions (last_seen_at desc);

create index if not exists idx_auth_sessions_account on auth_sessions (account_id);
create index if not exists idx_auth_sessions_expires on auth_sessions (expires_at);

-- Pembatas percobaan login (brute-force protection)
create table if not exists auth_login_attempts (
  username text primary key,
  failed_count integer not null default 0,
  first_failed_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  locked_until timestamptz
);

-- Index pendukung lookup yang sering dipakai dashboard/absensi
create index if not exists idx_students_class_name on students (class_name);
create index if not exists idx_homeroom_teacher on homeroom_classes (teacher_id);
create index if not exists idx_accounts_student on accounts (student_id);
create index if not exists idx_accounts_teacher on accounts (teacher_id);
create index if not exists idx_class_members_student on class_members (student_id);
create index if not exists idx_class_submissions_student on class_submissions (student_id);

-- ------------------------------------------------------------
-- Statistik kunjungan situs (agregat harian, tanpa data pribadi)
-- ------------------------------------------------------------
create table if not exists page_views (
  day date not null default current_date,
  path text not null,
  views integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, path)
);
create index if not exists idx_page_views_day on page_views (day desc);

create table if not exists site_visits (
  day date not null default current_date,
  visitor_id text not null,
  first_seen timestamptz not null default now(),
  primary key (day, visitor_id)
);
create index if not exists idx_site_visits_day on site_visits (day desc);
