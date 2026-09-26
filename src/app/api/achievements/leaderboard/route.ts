import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/api-auth";
import { achievementPoints } from "@/lib/achievement-points";
import { dbConfigured, getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const text = (v: unknown) => (v == null ? "" : String(v));

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

  try {
    const sql = getDb();
    const rows = (await sql`
      select a.student_name as student_name,
             coalesce(s.class_name, 'Tanpa Kelas') as class_name,
             a.level as level,
             count(*)::int as total
      from achievements a
      left join students s on s.name = a.student_name
      where a.status in ('published', 'draft', 'approved') and a.student_name is not null
      group by 1, 2, 3
    `) as Row[];

    const classMap = new Map<string, { className: string; total: number; points: number }>();
    const studentMap = new Map<string, LeaderboardStudent>();

    for (const row of rows) {
      const className = text(row.class_name) || "Tanpa Kelas";
      const name = text(row.student_name);
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

    return NextResponse.json({ data: { classes, students, me } });
  } catch {
    return NextResponse.json({ data: empty });
  }
}
