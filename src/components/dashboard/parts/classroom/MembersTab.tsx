"use client";

import { classInitials, type ClassroomClass } from "@/lib/classroom";
import { Avatar } from "@/components/dashboard/parts/classroom/ClassroomUi";

type Props = {
  isTeacher: boolean;
  userName: string;
  activeClass: ClassroomClass;
};

export default function MembersTab({ isTeacher, userName, activeClass }: Props) {
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <div className="card p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Guru</h2>
        <div className="mt-3 flex items-center gap-3">
          <Avatar initials={activeClass.teacherInitials} className="h-11 w-11 text-sm" />
          <div>
            <div className="text-sm font-semibold text-ink">{activeClass.teacher}</div>
            <div className="text-xs text-muted">Guru {activeClass.subject}</div>
          </div>
        </div>
      </div>
      <div className="card p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
          {isTeacher ? "Siswa" : "Teman Sekelas"}
        </h2>
        <ul className="mt-3 space-y-3">
          {activeClass.students.map((name) => (
            <li key={name} className="flex items-center gap-3">
              <Avatar initials={classInitials(name)} />
              <span className="text-sm text-ink">{name}</span>
              {name === userName && (
                <span className="badge bg-brand-green/10 text-[10px] font-semibold text-brand-green">
                  Kamu
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
