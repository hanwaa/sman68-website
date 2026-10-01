import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/api-auth";
import { achievementPoints } from "@/lib/achievement-points";
import { dbConfigured, getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const text = (v: unknown) => (v == null ? "" : String(v));

// Cache server 120 dtk untuk agregat leaderboard (full-scan achievements).
let leaderboardCache: { at: number; body: unknown } | null = null;
const LEADERBOARD_TTL_MS = 120_000;

export type LeaderboardClass = {
  className: string;
  total: number;
  points: number;
  rank: number;
};

export type LeaderboardStudent = {
  name: string;
  className: string;
  total: number;
  points: number;
};

export type LeaderboardMe = {
  name: string;
  className: string | null;
  total: number;
  points: number;
  classRank: number | null;
  classPoints: number;
  classTotal: number;
};

export async function GET() {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  const empty = { classes: [] as LeaderboardClass[], students: [] as LeaderboardStudent[], me: null as LeaderboardMe | null };
  if (!dbConfigured()) {
    return NextResponse.json({ data: empty });
  }

  // Cache server 120 dtk: agregat full-scan, tidak perlu dihitung per request.
  const now = Date.now();
  if (leaderboardCache && now - leaderboardCache.at < LEADERBOARD_TTL_MS) {
    return NextResponse.json(leaderboardCache.body);
  }

  try {
    const sql = getDb();
    // Agregat tanpa join (hindari fan-out nama kembar yang menggandakan
    // hitungan). Kelas dipetakan terpisah via lookup distinct.
    const rows = (await sql`
      select a.student_name as student_name,
              a.level as level,
              count(*)::int as total
      from achievements a
      where a.status in ('published', 'draft', 'approved') and a.student_name is not null
      group by 1, 2
    `) as Row[];
    const names = Array.from(new Set(rows.map((r) => text(r.student_name)).filter(Boolean))).slice(0, 2000);
    const classRows =
      names.length === 0
        ? []
        : ((await sql.query(
            `select distinct on (s.name) s.name as name, s.class_name as class_name
             from students s where s.name = any($1) order by s.name, s.class_name`,
            [names]
          )) as Row[]);
    const classByName = new Map(classRows.map((r) => [text(r.name), text(r.class_name) || "Tanpa Kelas"]));

    const classMap = new Map<string, { className: string; total: number; points: number }>();
    const studentMap = new Map<string, LeaderboardStudent>();

    for (const row of rows) {
      const name = text(row.student_name);
      const className = classByName.get(name) ?? "Tanpa Kelas";
      const total = Number(row.total) || 0;
      const points = achievementPoints(text(row.level)) * total;

      const cls = classMap.get(className) ?? { className, total: 0, points: 0 };
      cls.total += total;
      cls.points += points;
      classMap.set(className, cls);

      const key = `${className}::${name}`;
      const student = studentMap.get(key) ?? { name, className, total: 0, points: 0 };
      student.total += total;
      student.points += points;
      studentMap.set(key, student);
    }

    const classes: LeaderboardClass[] = [...classMap.values()]
      .sort((a, b) => b.points - a.points || b.total - a.total || a.className.localeCompare(b.className))
      .map((cls, index) => ({ ...cls, rank: index + 1 }));

    const students = [...studentMap.values()]
      .sort((a, b) => b.points - a.points || b.total - a.total || a.name.localeCompare(b.name))
      .slice(0, 10);

    let me: LeaderboardMe | null = null;
    if (account.role === "student") {
      const mine = [...studentMap.values()].find((student) => student.name === account.name);
      const myClass =
        account.className ?? mine?.className ?? null;
      const classEntry = myClass ? classes.find((cls) => cls.className === myClass) ?? null : null;
      me = {
        name: account.name,
        className: myClass,
        total: mine?.total ?? 0,
        points: mine?.points ?? 0,
        classRank: classEntry?.rank ?? null,
        classPoints: classEntry?.points ?? 0,
        classTotal: classEntry?.total ?? 0,
      };
    }

    const payload = { data: { classes, students, me } };
    leaderboardCache = { at: Date.now(), body: payload };
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ data: empty });
  }
}
