"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, Plus, School, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalA11y } from "@/lib/useModalA11y";
import { uploadToR2 } from "@/lib/upload";
import {
  apiClassroomAction,
  apiFetchClassroomStore,
  assignmentsFor,
  classInitials,
  classesFor,
  postsFor,
  submissionOf,
  type ClassAssignment,
  type ClassAttachment,
  type ClassPost,
  type ClassRequest,
  type ClassroomClass,
  type ClassroomRole,
  type ClassroomStore,
} from "@/lib/classroom";
import ClassroomModal from "@/components/dashboard/parts/classroom/ClassroomModal";
import ClassroomListView from "@/components/dashboard/parts/classroom/ClassroomListView";
import ForumTab from "@/components/dashboard/parts/classroom/ForumTab";
import AssignmentsTab from "@/components/dashboard/parts/classroom/AssignmentsTab";
import GradesTab from "@/components/dashboard/parts/classroom/GradesTab";
import MembersTab from "@/components/dashboard/parts/classroom/MembersTab";
import RequestsTab from "@/components/dashboard/parts/classroom/RequestsTab";
import CreateAssignmentModal, {
  type AssignmentDraft,
} from "@/components/dashboard/parts/classroom/CreateAssignmentModal";
import AssignmentDetailModal from "@/components/dashboard/parts/classroom/AssignmentDetailModal";
import GradeAssignmentModal from "@/components/dashboard/parts/classroom/GradeAssignmentModal";

type Tab = "forum" | "tugas" | "nilai" | "orang" | "permintaan";

type GradeDraft = { grade: string; feedback: string };

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const isDriveUrl = (url: string) => /^https?:\/\/(drive|docs)\.google\.com\//i.test(url.trim());

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const TABS: { id: Tab; label: string; teacherOnly?: boolean }[] = [
  { id: "forum", label: "Forum" },
  { id: "tugas", label: "Tugas" },
  { id: "nilai", label: "Nilai" },
  { id: "orang", label: "Orang" },
  { id: "permintaan", label: "Permintaan", teacherOnly: true },
];

interface ClassroomProps {
  role: ClassroomRole;
  userName: string;
  onShowToast?: (msg: string) => void;
}

export default function Classroom({ role, userName, onShowToast = () => {} }: ClassroomProps) {
  const isTeacher = role === "teacher";
  const [store, setStore] = useState<ClassroomStore>(() => ({ classes: [], posts: [], assignments: [] }));
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("forum");

  const [postText, setPostText] = useState("");
  const [postKind, setPostKind] = useState<"announcement" | "material">("announcement");
  const [postFile, setPostFile] = useState<ClassAttachment | null>(null);
  const [postLink, setPostLink] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [classModal, setClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", section: "", subject: "", room: "" });
  const [joinCode, setJoinCode] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("Semua");

  const [asgModal, setAsgModal] = useState(false);
  const [asgFile, setAsgFile] = useState<ClassAttachment | null>(null);
  const [asgLink, setAsgLink] = useState("");

  const [gradeTarget, setGradeTarget] = useState<ClassAssignment | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, GradeDraft>>({});
  const [detailTarget, setDetailTarget] = useState<ClassAssignment | null>(null);
  const [driveLink, setDriveLink] = useState("");

  const classModalRef = useModalA11y<HTMLDivElement>(classModal, () => setClassModal(false));
  const asgModalRef = useModalA11y<HTMLDivElement>(asgModal, () => setAsgModal(false));
  const gradeModalRef = useModalA11y<HTMLDivElement>(!!gradeTarget, () => setGradeTarget(null));
  const detailModalRef = useModalA11y<HTMLDivElement>(!!detailTarget, () => setDetailTarget(null));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await apiFetchClassroomStore(role, userName);
      if (cancelled) return;
      if (remote) setStore(remote);
      setStoreLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [role, userName]);

  // Guru: pantau permintaan bergabung terbaru secara berkala.
  useEffect(() => {
    if (!isTeacher) return;
    const timer = setInterval(async () => {
      const remote = await apiFetchClassroomStore(role, userName);
      if (remote) setStore(remote);
    }, 60_000);
    return () => clearInterval(timer);
  }, [isTeacher, role, userName]);

  const myClasses = useMemo(() => classesFor(store, role), [store, role]);
  const studentPendingClasses = useMemo(
    () => (isTeacher ? [] : store.classes.filter((c) => c.pending)),
    [store, isTeacher]
  );
  const teacherRequests = useMemo(
    () =>
      isTeacher
        ? store.classes
            .filter((c) => c.teacherOwned)
            .reduce((total, c) => total + c.requests.length, 0)
        : 0,
    [store, isTeacher]
  );
  const [refreshing, setRefreshing] = useState(false);
  const activeClass = myClasses.find((c) => c.id === activeClassId) ?? null;
  const homeroomClass = myClasses.find((c) => c.id.startsWith("walikelas-")) ?? myClasses[0] ?? null;
  const studentClassLabel = homeroomClass?.section ?? "-";
  const studentWaliName = homeroomClass?.teacher ?? "Belum ada";
  const classPosts = activeClass ? postsFor(store, activeClass.id) : [];
  const classAssignments = activeClass ? assignmentsFor(store, activeClass.id) : [];

  const studentPending = useMemo(() => {
    if (isTeacher) return 0;
    return store.assignments.filter(
      (a) =>
        classesFor(store, "student").some((c) => c.id === a.classId) &&
        submissionOf(a, userName)?.status === "assigned"
    ).length;
  }, [store, isTeacher, userName]);

  const teacherToGrade = useMemo(() => {
    if (!isTeacher) return 0;
    return store.assignments
      .filter((a) => store.classes.some((c) => c.id === a.classId && c.teacherOwned))
      .reduce(
        (total, a) => total + a.submissions.filter((s) => s.status === "turned_in").length,
        0
      );
  }, [store, isTeacher]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      onShowToast(`Kode kelas ${code} disalin.`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      onShowToast(`Kode kelas: ${code}`);
    }
  };

  const openClass = (cls: ClassroomClass) => {
    setActiveClassId(cls.id);
    setTab("forum");
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim() || !classForm.section.trim()) return;
    const name = classForm.name.trim();
    const section = classForm.section.trim();
    const subject = classForm.subject.trim() || name;
    const room = classForm.room.trim() || "-";

    const result = await apiClassroomAction({
      action: "create-class",
      teacherName: userName,
      name,
      section,
      subject,
      room,
      description: `Kelas ${name} untuk ${section}.`,
    });
    if (!result.ok || !result.id) {
      onShowToast(result.error ?? "Gagal membuat kelas.");
      return;
    }

    const newClass: ClassroomClass = {
      id: result.id,
      name,
      section,
      subject,
      room,
      code: result.code ?? "-",
      teacher: userName,
      teacherInitials: classInitials(userName),
      color: "bg-brand-pine",
      description: `Kelas ${name} untuk ${section}.`,
      enrolled: false,
      pending: false,
      teacherOwned: true,
      students: [],
      requests: [],
    };
    setStore((prev) => ({ ...prev, classes: [newClass, ...prev.classes] }));
    setClassForm({ name: "", section: "", subject: "", room: "" });
    setClassModal(false);
    onShowToast(`Kelas "${newClass.name}" dibuat. Kode: ${newClass.code}`);
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    const target = store.classes.find((c) => c.code === code && !c.enrolled && !c.pending);
    if (!target) {
      onShowToast(`Kode "${code}" tidak ditemukan atau permintaanmu sudah terkirim.`);
      return;
    }
    const result = await apiClassroomAction({
      action: "join-class",
      classId: target.id,
      studentName: userName,
    });
    if (!result.ok) {
      onShowToast(result.error ?? "Gagal mengirim permintaan bergabung.");
      return;
    }
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === target.id ? { ...c, pending: true } : c)),
    }));
    setJoinCode("");
    setClassModal(false);
    onShowToast(`Permintaan bergabung ke ${target.name} ${target.section} terkirim. Tunggu persetujuan guru.`);
  };

  const handleApproveMember = async (request: ClassRequest) => {
    if (!activeClass) return;
    const result = await apiClassroomAction({
      action: "approve-member",
      classId: activeClass.id,
      studentId: request.id,
    });
    if (!result.ok) {
      onShowToast(result.error ?? "Gagal menyetujui permintaan.");
      return;
    }
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id === activeClass.id
          ? {
              ...c,
              requests: c.requests.filter((r) => r.id !== request.id),
              students: [...c.students, request.name],
            }
          : c
      ),
    }));
    onShowToast(`${request.name} disetujui bergabung ke ${activeClass.name}.`);
  };

  const handleRejectMember = async (request: ClassRequest) => {
    if (!activeClass) return;
    const result = await apiClassroomAction({
      action: "reject-member",
      classId: activeClass.id,
      studentId: request.id,
    });
    if (!result.ok) {
      onShowToast(result.error ?? "Gagal menolak permintaan.");
      return;
    }
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id === activeClass.id
          ? { ...c, requests: c.requests.filter((r) => r.id !== request.id) }
          : c
      ),
    }));
    onShowToast(`Permintaan ${request.name} ditolak.`);
  };

  const handleDeleteClass = async () => {
    if (!activeClass) return;
    const confirmed = window.confirm(
      `Hapus kelas "${activeClass.name}" (${activeClass.section})? Semua materi, tugas, dan anggota kelas ini ikut terhapus.`
    );
    if (!confirmed) return;
    const result = await apiClassroomAction({ action: "delete-class", classId: activeClass.id });
    if (!result.ok) {
      onShowToast(result.error ?? "Gagal menghapus kelas.");
      return;
    }
    const className = activeClass.name;
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== activeClass.id),
      posts: prev.posts.filter((p) => p.classId !== activeClass.id),
      assignments: prev.assignments.filter((a) => a.classId !== activeClass.id),
    }));
    setActiveClassId(null);
    setTab("forum");
    onShowToast(`Kelas "${className}" dihapus.`);
  };

  const refreshStore = async () => {
    setRefreshing(true);
    const remote = await apiFetchClassroomStore(role, userName);
    if (remote) setStore(remote);
    setRefreshing(false);
  };

  const attachFile = async (
    file: File | undefined,
    onLoad: (attachment: ClassAttachment) => void
  ) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      onShowToast("Ukuran berkas maksimal 10 MB.");
      return;
    }
    try {
      const uploaded = await uploadToR2(file, "classroom");
      onLoad({ name: file.name, url: uploaded.publicUrl ?? uploaded.key, type: "file" });
      onShowToast(`Berkas "${file.name}" diunggah ke penyimpanan.`);
    } catch {
      if (file.size > 1.5 * 1024 * 1024) {
        onShowToast("Penyimpanan R2 tidak tersedia — berkas terlalu besar untuk mode offline.");
        return;
      }
      try {
        const url = await readFileAsDataUrl(file);
        onLoad({ name: file.name, url, type: "file" });
        onShowToast(`Berkas "${file.name}" siap dilampirkan (mode offline).`);
      } catch {
        onShowToast("Gagal membaca berkas. Coba berkas lain.");
      }
    }
  };

  const attachmentFromLink = (link: string, fallbackName: string): ClassAttachment | undefined => {
    const url = link.trim();
    if (!url) return undefined;
    return {
      name: isDriveUrl(url) ? `${fallbackName} (Google Drive)` : fallbackName,
      url,
      type: isDriveUrl(url) ? "drive" : "file",
    };
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass) return;
    const attachment = postFile ?? attachmentFromLink(postLink, "Materi");
    if (!postText.trim() && !attachment) return;

    const result = await apiClassroomAction({
      action: "add-post",
      classId: activeClass.id,
      teacherName: userName,
      content: postText.trim(),
      kind: postKind,
      attachmentName: attachment?.name,
      attachmentUrl: attachment?.url,
    });
    if (!result.ok || !result.id) {
      onShowToast(result.error ?? "Gagal membagikan postingan.");
      return;
    }

    const post: ClassPost = {
      id: result.id,
      classId: activeClass.id,
      author: userName,
      initials: classInitials(userName),
      time: "Baru saja",
      kind: postKind,
      content: postText.trim(),
      attachment,
      comments: [],
    };
    setStore((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
    setPostText("");
    setPostFile(null);
    setPostLink("");
    onShowToast(
      attachment
        ? `Materi "${attachment.name}" dibagikan ke kelas.`
        : isTeacher
          ? "Pengumuman dibagikan ke kelas."
          : "Komentar kelas dikirim."
    );
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentDrafts[postId] ?? "").trim();
    if (!text) return;
    const result = await apiClassroomAction({
      action: "add-comment",
      postId,
      authorName: userName,
      content: text,
    });
    if (!result.ok || !result.id) {
      onShowToast(result.error ?? "Gagal mengirim komentar.");
      return;
    }
    setStore((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: result.id as string,
                  author: userName,
                  initials: classInitials(userName),
                  time: "Baru saja",
                  text,
                },
              ],
            }
          : p
      ),
    }));
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleCreateAssignment = async (draft: AssignmentDraft) => {
    if (!activeClass || !draft.title.trim()) return;
    const attachment = asgFile ?? attachmentFromLink(asgLink, "Lampiran tugas");
    const dueTs = Date.now() + 7 * 86400000;
    const points = Number(draft.points) || 100;

    const result = await apiClassroomAction({
      action: "create-assignment",
      classId: activeClass.id,
      teacherName: userName,
      title: draft.title.trim(),
      instructions: draft.instructions.trim(),
      topic: draft.topic.trim() || "Umum",
      due: draft.due.trim() || "Belum dijadwalkan",
      dueTs,
      points,
      attachmentName: attachment?.name,
      attachmentUrl: attachment?.url,
    });
    if (!result.ok || !result.id) {
      onShowToast(result.error ?? "Gagal membuat tugas.");
      return;
    }

    const assignment: ClassAssignment = {
      id: result.id,
      classId: activeClass.id,
      title: draft.title.trim(),
      instructions: draft.instructions.trim(),
      topic: draft.topic.trim() || "Umum",
      due: draft.due.trim() || "Belum dijadwalkan",
      dueTs,
      points,
      attachment,
      submissions: activeClass.students.map((name) => ({
        student: name,
        initials: classInitials(name),
        status: "assigned" as const,
      })),
    };
    setStore((prev) => ({ ...prev, assignments: [assignment, ...prev.assignments] }));
    setAsgFile(null);
    setAsgLink("");
    setTab("tugas");
    onShowToast(`Tugas "${assignment.title}" dipublikasikan.`);
  };

  const openDetail = (assignment: ClassAssignment) => {
    setDetailTarget(assignment);
    setDriveLink(submissionOf(assignment, userName)?.link ?? "");
  };

  const handleSubmitLink = (assignmentId: string) => {
    const url = driveLink.trim();
    if (!isDriveUrl(url)) {
      onShowToast("Masukkan tautan Google Drive yang valid (drive.google.com atau docs.google.com).");
      return;
    }
    setStore((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        const existing = a.submissions.find((s) => s.student === userName);
        const updated = {
          student: userName,
          initials: classInitials(userName),
          status: (existing?.status === "graded" ? "graded" : "turned_in") as
            | "turned_in"
            | "graded",
          submittedAt: "Baru saja",
          link: url,
          grade: existing?.grade,
          feedback: existing?.feedback,
        };
        const others = a.submissions.filter((s) => s.student !== userName);
        return { ...a, submissions: [...others, updated] };
      }),
    }));
    setDetailTarget((prev) =>
      prev
        ? {
            ...prev,
            submissions: [
              ...prev.submissions.filter((s) => s.student !== userName),
              {
                student: userName,
                initials: classInitials(userName),
                status: "turned_in",
                submittedAt: "Baru saja",
                link: url,
              },
            ],
          }
        : prev
    );
    void apiClassroomAction({
      action: "submit",
      assignmentId,
      studentName: userName,
      link: url,
    });
    onShowToast("Tugas berhasil dikumpulkan lewat tautan Google Drive.");
  };

  const handleCancelSubmit = (assignmentId: string) => {
    setStore((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              submissions: a.submissions.map((s) =>
                s.student === userName
                  ? { ...s, status: "assigned", submittedAt: undefined, link: undefined }
                  : s
              ),
            }
          : a
      ),
    }));
    setDriveLink("");
    setDetailTarget((prev) =>
      prev
        ? {
            ...prev,
            submissions: prev.submissions.map((s) =>
              s.student === userName
                ? { ...s, status: "assigned", submittedAt: undefined, link: undefined }
                : s
            ),
          }
        : prev
    );
    void apiClassroomAction({
      action: "cancel-submit",
      assignmentId,
      studentName: userName,
    });
    onShowToast("Pengumpulan dibatalkan. Kamu bisa mengumpulkan ulang.");
  };

  const openGrade = (assignment: ClassAssignment) => {
    setGradeTarget(assignment);
    const drafts: Record<string, GradeDraft> = {};
    assignment.submissions.forEach((s) => {
      drafts[s.student] = { grade: s.grade?.toString() ?? "", feedback: s.feedback ?? "" };
    });
    setGradeDrafts(drafts);
  };

  const saveGrade = (student: string) => {
    if (!gradeTarget) return;
    const draft = gradeDrafts[student] ?? { grade: "", feedback: "" };
    const numeric = Number(draft.grade);
    setStore((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === gradeTarget.id
          ? {
              ...a,
              submissions: a.submissions.map((s) =>
                s.student === student
                  ? {
                      ...s,
                      status: draft.grade === "" ? s.status : "graded",
                      grade: draft.grade === "" ? s.grade : numeric,
                      feedback: draft.feedback || s.feedback,
                    }
                  : s
              ),
            }
          : a
      ),
    }));
    setGradeTarget((prev) =>
      prev
        ? {
            ...prev,
            submissions: prev.submissions.map((s) =>
              s.student === student && draft.grade !== ""
                ? { ...s, status: "graded", grade: numeric, feedback: draft.feedback }
                : s
            ),
          }
        : prev
    );
    void apiClassroomAction({
      action: "grade",
      assignmentId: gradeTarget.id,
      studentName: student,
      grade: draft.grade === "" ? undefined : numeric,
      feedback: draft.feedback || undefined,
    });
    onShowToast(`Nilai ${student} disimpan.`);
  };

  /* ------------------------------- LIST VIEW ------------------------------- */

  if (!activeClass) {
    return (
      <>
        <ClassroomListView
          isTeacher={isTeacher}
          myClasses={myClasses}
          studentPendingClasses={studentPendingClasses}
          subjectFilter={subjectFilter}
          studentPending={studentPending}
          teacherToGrade={teacherToGrade}
          teacherRequests={teacherRequests}
          studentClassLabel={studentClassLabel}
          studentWaliName={studentWaliName}
          assignmentCountFor={(classId) => assignmentsFor(store, classId).length}
          doneCountFor={(cls) => {
            const list = assignmentsFor(store, cls.id);
            return isTeacher
              ? list.reduce((t, a) => t + a.submissions.filter((s) => s.status !== "assigned").length, 0)
              : list.filter((a) => submissionOf(a, userName)?.status !== "assigned").length;
          }}
          onSubjectFilterChange={setSubjectFilter}
          onOpenClass={openClass}
          onOpenClassModal={() => setClassModal(true)}
          onReviewRequest={() => {
            const target = myClasses.find((c) => c.requests.length > 0);
            if (target) {
              setActiveClassId(target.id);
              setTab("permintaan");
            }
          }}
        />

        <ClassroomModal
          open={classModal}
          onClose={() => setClassModal(false)}
          label={isTeacher ? "Buat kelas baru" : "Gabung kelas"}
          dialogRef={classModalRef}
        >
          {isTeacher ? (
            <form onSubmit={handleCreateClass} className="mt-2 space-y-3.5">
              <h2 className="font-display text-lg font-bold text-ink">Buat Kelas Baru</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Nama Kelas</label>
                <input
                  value={classForm.name}
                  onChange={(e) => setClassForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Matematika Lanjutan"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Kelas</label>
                  <input
                    value={classForm.section}
                    onChange={(e) => setClassForm((f) => ({ ...f, section: e.target.value }))}
                    placeholder="Contoh: X.1"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Mata Pelajaran</label>
                  <input
                    value={classForm.subject}
                    onChange={(e) => setClassForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Matematika"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Ruang</label>
                <input
                  value={classForm.room}
                  onChange={(e) => setClassForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="Ruang 304"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setClassModal(false)} className="btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  <Plus size={14} /> Buat Kelas
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinClass} className="mt-2 space-y-3.5">
              <h2 className="font-display text-lg font-bold text-ink">Gabung Kelas</h2>
              <p className="text-xs leading-relaxed text-muted">
                Minta kode kelas kepada guru, lalu masukkan kode tersebut di bawah ini. Contoh kode
                yang bisa dicoba: <span className="font-semibold text-ink">MTK-68X1</span>.
              </p>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Contoh: MTK-68X1"
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-center text-sm font-bold uppercase tracking-widest focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                required
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setClassModal(false)} className="btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  <School size={14} /> Gabung
                </button>
              </div>
            </form>
          )}
        </ClassroomModal>
      </>
    );
  }

  /* ------------------------------ DETAIL VIEW ------------------------------ */

  const gradedAssignments = classAssignments.filter(
    (a) => submissionOf(a, userName)?.status === "graded"
  );
  const average =
    gradedAssignments.length > 0
      ? Math.round(
          gradedAssignments.reduce((t, a) => t + (submissionOf(a, userName)?.grade ?? 0), 0) /
            gradedAssignments.length
        )
      : null;

  if (!storeLoaded) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Memuat kelas digital...</span>
        <div className="h-8 w-64 animate-pulse rounded-lg bg-line" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-line/70" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-line/60" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setActiveClassId(null)}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> Semua kelas
      </button>

      <div className={cn("relative overflow-hidden rounded-xl p-5 text-white sm:p-6", activeClass.color)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold sm:text-2xl">{activeClass.name}</h1>
            <p className="mt-1 text-xs text-white/75">
              {activeClass.section} · {activeClass.room} · {activeClass.teacher}
            </p>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/75">
              {activeClass.description}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 self-start">
            <button
              onClick={() => copyCode(activeClass.code)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              {copiedCode === activeClass.code ? <Check size={13} /> : <Copy size={13} />}
              Kode: {activeClass.code}
            </button>
            {isTeacher && (
              <button
                onClick={handleDeleteClass}
                className="inline-flex items-center gap-2 rounded-lg border border-danger/40 bg-danger-deep/20 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-danger-deep/40"
                aria-label={`Hapus kelas ${activeClass.name}`}
              >
                <Trash2 size={13} /> Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.filter((item) => !item.teacherOnly || isTeacher).map((item) => {
          const active = tab === item.id;
          const badge = item.id === "permintaan" ? activeClass.requests.length : 0;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "border-brand-pine text-ink"
                  : "border-transparent text-muted hover:text-ink"
              )}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
              {badge > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-deep px-1 text-[9px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "forum" && (
        <ForumTab
          isTeacher={isTeacher}
          userName={userName}
          posts={classPosts}
          assignments={classAssignments}
          studentCount={activeClass.students.length}
          postKind={postKind}
          postText={postText}
          postLink={postLink}
          postFile={postFile}
          commentDrafts={commentDrafts}
          onPostKindChange={setPostKind}
          onPostTextChange={setPostText}
          onPostLinkChange={setPostLink}
          onPostFileChange={setPostFile}
          onFilePicked={(file) => attachFile(file, setPostFile)}
          onSubmitPost={handleAddPost}
          onCommentDraftChange={(postId, value) =>
            setCommentDrafts((prev) => ({ ...prev, [postId]: value }))
          }
          onSubmitComment={handleAddComment}
          onGoToAssignments={() => setTab("tugas")}
        />
      )}

      {tab === "tugas" && (
        <AssignmentsTab
          isTeacher={isTeacher}
          userName={userName}
          assignments={classAssignments}
          onCreate={() => setAsgModal(true)}
          onOpenGrade={openGrade}
          onOpenDetail={openDetail}
        />
      )}

      {tab === "nilai" && (
        <GradesTab
          isTeacher={isTeacher}
          userName={userName}
          assignments={classAssignments}
          average={average}
          onOpenGrade={openGrade}
        />
      )}

      {tab === "orang" && (
        <MembersTab isTeacher={isTeacher} userName={userName} activeClass={activeClass} />
      )}

      {tab === "permintaan" && isTeacher && (
        <RequestsTab
          activeClass={activeClass}
          refreshing={refreshing}
          onRefresh={refreshStore}
          onApprove={handleApproveMember}
          onReject={handleRejectMember}
        />
      )}

      <CreateAssignmentModal
        open={asgModal}
        dialogRef={asgModalRef}
        file={asgFile}
        link={asgLink}
        onLinkChange={setAsgLink}
        onFileChange={setAsgFile}
        onFilePicked={(file) => attachFile(file, setAsgFile)}
        onSubmit={handleCreateAssignment}
        onClose={() => setAsgModal(false)}
      />

      <AssignmentDetailModal
        assignment={detailTarget}
        userName={userName}
        dialogRef={detailModalRef}
        driveLink={driveLink}
        onDriveLinkChange={setDriveLink}
        onSubmitLink={handleSubmitLink}
        onCancelSubmit={handleCancelSubmit}
        onClose={() => setDetailTarget(null)}
      />

      <GradeAssignmentModal
        assignment={gradeTarget}
        dialogRef={gradeModalRef}
        gradeDrafts={gradeDrafts}
        onGradeDraftChange={(student, patch) =>
          setGradeDrafts((prev) => ({
            ...prev,
            [student]: { grade: prev[student]?.grade ?? "", feedback: prev[student]?.feedback ?? "", ...patch },
          }))
        }
        onSave={saveGrade}
        onClose={() => setGradeTarget(null)}
      />
    </div>
  );
}
