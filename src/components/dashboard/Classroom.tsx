"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle,
  ClipboardList,
  Clock,
  Copy,
  FileText,
  GraduationCap,
  Link2,
  Megaphone,
  Paperclip,
  Plus,
  RefreshCw,
  School,
  Send,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
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

type Tab = "forum" | "tugas" | "nilai" | "orang" | "permintaan";

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

function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-xs font-bold text-brand-green",
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function StatusBadge({ status }: { status: "assigned" | "turned_in" | "graded" }) {
  const map = {
    assigned: { label: "Belum dikumpulkan", className: "bg-line text-muted" },
    turned_in: { label: "Terkumpul", className: "bg-brand-green/10 text-brand-green" },
    graded: { label: "Sudah dinilai", className: "bg-brand-pine/10 text-brand-pine" },
  } as const;
  const meta = map[status];
  return <span className={cn("badge text-[10px] font-semibold", meta.className)}>{meta.label}</span>;
}

function Modal({
  open,
  onClose,
  label,
  dialogRef,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  dialogRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-pine/70"
          />
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-xl bg-white p-5 text-ink shadow-card focus:outline-none sm:p-6",
              wide ? "max-w-2xl" : "max-w-md"
            )}
          >
            <button onClick={onClose} className="btn-icon absolute right-3 top-3" aria-label="Tutup">
              <X size={18} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

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
  const [asgForm, setAsgForm] = useState({
    title: "",
    topic: "",
    instructions: "",
    due: "",
    points: "100",
  });
  const [asgFile, setAsgFile] = useState<ClassAttachment | null>(null);
  const [asgLink, setAsgLink] = useState("");

  const [gradeTarget, setGradeTarget] = useState<ClassAssignment | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { grade: string; feedback: string }>>({});
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !asgForm.title.trim()) return;
    const attachment = asgFile ?? attachmentFromLink(asgLink, "Lampiran tugas");
    const dueTs = Date.now() + 7 * 86400000;
    const points = Number(asgForm.points) || 100;

    const result = await apiClassroomAction({
      action: "create-assignment",
      classId: activeClass.id,
      teacherName: userName,
      title: asgForm.title.trim(),
      instructions: asgForm.instructions.trim(),
      topic: asgForm.topic.trim() || "Umum",
      due: asgForm.due.trim() || "Belum dijadwalkan",
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
      title: asgForm.title.trim(),
      instructions: asgForm.instructions.trim(),
      topic: asgForm.topic.trim() || "Umum",
      due: asgForm.due.trim() || "Belum dijadwalkan",
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
    setAsgForm({ title: "", topic: "", instructions: "", due: "", points: "100" });
    setAsgFile(null);
    setAsgLink("");
    setAsgModal(false);
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
    const drafts: Record<string, { grade: string; feedback: string }> = {};
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
      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink md:text-3xl">
              Kelas Digital
            </h1>
            <p className="text-sm text-muted">
              {isTeacher
                ? "Kelola kelas, materi, tugas, dan nilai siswa seperti ruang kelas online."
                : "Ikuti materi, kumpulkan tugas, dan pantau nilai kelasmu di satu tempat."}
            </p>
          </div>
          <button
            onClick={() => setClassModal(true)}
            className={cn("self-start sm:self-auto", isTeacher ? "btn-primary" : "btn-ghost")}
          >
            <Plus size={15} /> {isTeacher ? "Buat Kelas" : "Gabung Kelas"}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <div className="font-display text-2xl font-extrabold text-brand-green">
              {myClasses.length}
            </div>
            <div className="mt-1 text-xs font-semibold text-ink">
              {isTeacher ? "Kelas Diampu" : "Kelas Diikuti"}
            </div>
          </div>
          <div className="card p-4">
            <div className="font-display text-2xl font-extrabold text-brand-pine">
              {isTeacher ? teacherToGrade : studentPending}
            </div>
            <div className="mt-1 text-xs font-semibold text-ink">
              {isTeacher ? "Perlu Dinilai" : "Tugas Menunggu"}
            </div>
          </div>
          <div className="card col-span-2 p-4 sm:col-span-1">
            <div className="font-display text-2xl font-extrabold text-brand-leaf">
              {isTeacher ? "Aktif" : studentClassLabel}
            </div>
            <div className="mt-1 text-xs font-semibold text-ink">
              {isTeacher ? "Semester Gasal" : "Kelas kamu"}
            </div>
          </div>
        </div>

        {!isTeacher && (
          <div className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-pine text-brand-lime">
              <School size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Kelas kamu
              </div>
              <div className="font-display text-xl font-extrabold text-ink">{studentClassLabel}</div>
              <div className="text-xs text-muted">Wali Kelas: {studentWaliName}</div>
            </div>
            <span className="badge bg-brand-green/10 font-semibold text-brand-green sm:ml-auto">
              {myClasses.length} mata pelajaran
            </span>
          </div>
        )}

        {!isTeacher && myClasses.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSubjectFilter("Semua")}
              className={cn("chip", subjectFilter === "Semua" && "chip-active")}
            >
              Semua Mapel
            </button>
            {myClasses.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSubjectFilter(cls.name)}
                className={cn("chip", subjectFilter === cls.name && "chip-active")}
              >
                {cls.name}
              </button>
            ))}
          </div>
        )}

        {isTeacher && teacherRequests > 0 && (
          <div className="card mb-5 flex flex-col gap-3 border-brand-lime/40 bg-brand-lime/10 p-4 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-lime/25 text-brand-pine">
              <UserPlus size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink">
                {teacherRequests} permintaan bergabung menunggu persetujuan
              </div>
              <div className="text-xs text-muted">
                Setujui atau tolak lewat tab Permintaan di kelas masing-masing.
              </div>
            </div>
            <button
              onClick={() => {
                const target = myClasses.find((c) => c.requests.length > 0);
                if (target) {
                  setActiveClassId(target.id);
                  setTab("permintaan");
                }
              }}
              className="btn-primary self-start text-xs sm:self-auto"
            >
              Tinjau
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(isTeacher
            ? myClasses
            : subjectFilter === "Semua"
              ? [...myClasses, ...studentPendingClasses]
              : myClasses.filter((c) => c.name === subjectFilter)
          ).map((cls) => {
            const assignments = assignmentsFor(store, cls.id);
            const done = isTeacher
              ? assignments.reduce(
                  (t, a) => t + a.submissions.filter((s) => s.status !== "assigned").length,
                  0
                )
              : assignments.filter((a) => submissionOf(a, userName)?.status !== "assigned").length;
            return (
              <button
                key={cls.id}
                onClick={() => (isTeacher || cls.enrolled ? openClass(cls) : undefined)}
                disabled={!isTeacher && !cls.enrolled}
                className={cn(
                  "card group flex flex-col overflow-hidden text-left",
                  !isTeacher && !cls.enrolled && "cursor-default"
                )}
              >
                <div className={cn("relative p-5 text-white", cls.color)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display text-base font-bold leading-snug">{cls.name}</h2>
                      <p className="mt-0.5 text-xs text-white/70">
                        {cls.section} · {cls.room}
                      </p>
                    </div>
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/15 text-xs font-bold">
                      {classInitials(cls.name)}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/75">
                    {cls.teacher}
                  </p>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                    {cls.description}
                  </p>
                  {isTeacher && cls.requests.length > 0 && (
                    <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-brand-lime/25 px-2 py-0.5 text-[10px] font-bold text-brand-pine">
                      <UserPlus size={11} aria-hidden="true" />
                      {cls.requests.length} permintaan bergabung
                    </span>
                  )}
                  {!isTeacher && !cls.enrolled && (
                    <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      <Clock size={11} aria-hidden="true" />
                      Menunggu persetujuan guru
                    </span>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px]">
                    <span className="flex items-center gap-1 text-muted">
                      <ClipboardList size={12} aria-hidden="true" />
                      {assignments.length} tugas
                    </span>
                    <span className="font-semibold text-brand-green">
                      {isTeacher ? `${done} terkumpul` : `${done} selesai`}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Modal
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
        </Modal>
      </div>
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
                className="inline-flex items-center gap-2 rounded-lg border border-red-300/40 bg-red-500/20 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500/40"
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
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* FORUM */}
      {tab === "forum" && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            {isTeacher && (
              <form onSubmit={handleAddPost} className="card p-4">
                <div className="flex items-center gap-2">
                  <Avatar initials={classInitials(userName)} />
                  <select
                    value={postKind}
                    onChange={(e) => setPostKind(e.target.value as "announcement" | "material")}
                    className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-brand-green focus:outline-none"
                  >
                    <option value="announcement">Pengumuman</option>
                    <option value="material">Materi</option>
                  </select>
                </div>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  rows={3}
                  placeholder="Bagikan pengumuman atau materi ke kelas..."
                  className="mt-3 w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="btn-outline btn-sm cursor-pointer">
                    <Upload size={13} />
                    {postFile ? "Ganti Berkas" : "Unggah Berkas"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.mp4"
                      onChange={(e) => {
                        attachFile(e.target.files?.[0], setPostFile);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-muted">atau tempel tautan Drive:</span>
                  <input
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="min-w-[180px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                {postFile && (
                  <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-cream px-3 py-2 text-xs font-semibold text-ink">
                    <Paperclip size={13} className="flex-shrink-0 text-brand-green" />
                    <span className="truncate">{postFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setPostFile(null)}
                      className="btn-icon h-6 w-6"
                      aria-label="Hapus lampiran"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="mt-2 flex justify-end">
                  <button type="submit" className="btn-primary btn-sm">
                    <Send size={13} /> Bagikan
                  </button>
                </div>
              </form>
            )}

            {classPosts.length === 0 && (
              <div className="card p-8 text-center">
                <Megaphone size={28} className="mx-auto mb-3 text-line" aria-hidden="true" />
                <div className="text-sm font-semibold text-ink">Belum ada postingan</div>
                <div className="mt-1 text-xs text-muted">
                  Pengumuman dan materi dari guru akan tampil di sini.
                </div>
              </div>
            )}

            {classPosts.map((post) => (
              <article key={post.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={post.initials} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{post.author}</span>
                      <span
                        className={cn(
                          "badge text-[10px] font-semibold",
                          post.kind === "announcement"
                            ? "bg-brand-green/10 text-brand-green"
                            : "bg-brand-pine/10 text-brand-pine"
                        )}
                      >
                        {post.kind === "announcement" ? "Pengumuman" : "Materi"}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">{post.time}</span>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/85">
                  {post.content}
                </p>

                {post.attachment && (
                  <a
                    href={post.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-cream px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-brand-green/40 hover:bg-brand-mist"
                  >
                    {post.attachment.type === "drive" ? (
                      <Link2 size={13} className="flex-shrink-0 text-brand-green" aria-hidden="true" />
                    ) : (
                      <Paperclip size={13} className="flex-shrink-0 text-brand-green" aria-hidden="true" />
                    )}
                    <span className="truncate">{post.attachment.name}</span>
                  </a>
                )}

                <div className="mt-4 space-y-3 border-t border-line pt-3">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2.5">
                      <Avatar initials={comment.initials} className="h-7 w-7 text-[10px]" />
                      <div className="min-w-0">
                        <div className="text-xs">
                          <span className="font-semibold text-ink">{comment.author}</span>
                          <span className="ml-2 text-[10px] text-muted">{comment.time}</span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink/80">{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <input
                      value={commentDrafts[post.id] ?? ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      placeholder="Tulis komentar kelas..."
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="btn-icon text-brand-green hover:bg-brand-green/10 hover:text-brand-green"
                      aria-label="Kirim komentar"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-3">
            <div className="card p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Ringkasan</h2>
              <ul className="mt-3 space-y-2.5 text-xs">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <ClipboardList size={13} /> Tugas
                  </span>
                  <span className="font-semibold text-ink">{classAssignments.length}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Megaphone size={13} /> Postingan
                  </span>
                  <span className="font-semibold text-ink">{classPosts.length}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Users size={13} /> {isTeacher ? "Siswa" : "Teman"}
                  </span>
                  <span className="font-semibold text-ink">
                    {isTeacher
                      ? activeClass.students.length
                      : Math.max(activeClass.students.length - 1, 0)}
                  </span>
                </li>
              </ul>
            </div>
            <button onClick={() => setTab("tugas")} className="btn-ghost w-full justify-between">
              Lihat semua tugas <ArrowLeft size={14} className="rotate-180" />
            </button>
          </aside>
        </div>
      )}

      {/* TUGAS */}
      {tab === "tugas" && (
        <div className="mt-5 space-y-4">
          {isTeacher && (
            <div className="flex justify-end">
              <button onClick={() => setAsgModal(true)} className="btn-primary btn-sm">
                <Plus size={14} /> Buat Tugas
              </button>
            </div>
          )}

          {classAssignments.length === 0 && (
            <div className="card p-8 text-center">
              <ClipboardList size={28} className="mx-auto mb-3 text-line" aria-hidden="true" />
              <div className="text-sm font-semibold text-ink">Belum ada tugas</div>
              <div className="mt-1 text-xs text-muted">
                {isTeacher ? "Buat tugas pertama untuk kelas ini." : "Tugas baru akan tampil di sini."}
              </div>
            </div>
          )}

          {classAssignments.map((assignment) => {
            const mine = submissionOf(assignment, userName);
            const turnedIn = assignment.submissions.filter((s) => s.status !== "assigned").length;
            const graded = assignment.submissions.filter((s) => s.status === "graded").length;
            return (
              <div key={assignment.id} className="card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3.5">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                      <FileText size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-sm font-bold text-ink">{assignment.title}</h2>
                        <span className="badge bg-cream text-[10px] font-semibold text-muted">
                          {assignment.topic}
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={11} aria-hidden="true" /> Tenggat: {assignment.due}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award size={11} aria-hidden="true" /> {assignment.points} poin
                        </span>
                      </p>
                      {assignment.attachment && (
                        <a
                          href={assignment.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold text-brand-green hover:underline"
                        >
                          {assignment.attachment.type === "drive" ? (
                            <Link2 size={11} aria-hidden="true" />
                          ) : (
                            <Paperclip size={11} aria-hidden="true" />
                          )}
                          <span className="truncate">{assignment.attachment.name}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {isTeacher ? (
                    <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
                      <span className="text-[11px] text-muted">
                        {turnedIn}/{assignment.submissions.length} terkumpul · {graded} dinilai
                      </span>
                      <button onClick={() => openGrade(assignment)} className="btn-ghost btn-sm">
                        <CheckCircle size={13} /> Periksa
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
                      {mine && <StatusBadge status={mine.status} />}
                      {mine?.status === "graded" && (
                        <span className="font-display text-lg font-extrabold text-brand-green">
                          {mine.grade}
                          <span className="text-xs font-semibold text-muted">/{assignment.points}</span>
                        </span>
                      )}
                      <button onClick={() => openDetail(assignment)} className="btn-primary btn-sm">
                        {mine?.status === "assigned" ? (
                          <>
                            <Upload size={13} /> Kumpulkan
                          </>
                        ) : (
                          "Lihat Pengumpulan"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NILAI */}
      {tab === "nilai" && (
        <div className="mt-5 space-y-4">
          {!isTeacher && (
            <div className="card flex items-center justify-between p-4">
              <div>
                <div className="text-xs font-semibold text-muted">Rata-rata nilai kamu</div>
                <div className="font-display text-3xl font-extrabold text-brand-green">
                  {average ?? "—"}
                </div>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                <Award size={22} aria-hidden="true" />
              </span>
            </div>
          )}

          <div className="card overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-semibold">Tugas</th>
                  <th className="px-4 py-3 font-semibold">Tenggat</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {classAssignments.map((assignment) => {
                  const mine = submissionOf(assignment, userName);
                  return (
                    <tr key={assignment.id} className="hover:bg-cream/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{assignment.title}</div>
                        <div className="text-[11px] text-muted">{assignment.topic}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{assignment.due}</td>
                      <td className="px-4 py-3">
                        {isTeacher ? (
                          <span className="text-xs text-muted">
                            {assignment.submissions.filter((s) => s.status === "graded").length}/
                            {assignment.submissions.length} dinilai
                          </span>
                        ) : mine ? (
                          <StatusBadge status={mine.status} />
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isTeacher ? (
                          <button
                            onClick={() => openGrade(assignment)}
                            className="text-xs font-semibold text-brand-green hover:underline"
                          >
                            Periksa
                          </button>
                        ) : (
                          <span className="font-display font-extrabold text-ink">
                            {mine?.grade ?? "—"}
                            <span className="text-xs font-semibold text-muted">
                              /{assignment.points}
                            </span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORANG */}
      {tab === "orang" && (
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
      )}

      {/* PERMINTAAN BERGABUNG (guru) */}
      {tab === "permintaan" && isTeacher && (
        <div className="mt-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Permintaan Bergabung</h2>
                <p className="text-xs text-muted">
                  Setujui siswa untuk masuk ke {activeClass.name} {activeClass.section}.
                </p>
              </div>
              <button onClick={refreshStore} disabled={refreshing} className="btn-ghost text-xs">
                <RefreshCw size={13} className={cn(refreshing && "animate-spin")} /> Muat Ulang
              </button>
            </div>

            {activeClass.requests.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-cream">
                  <UserPlus size={20} className="text-muted" aria-hidden="true" />
                </div>
                <div className="text-sm font-semibold text-ink">Belum ada permintaan</div>
                <div className="mt-1 text-xs text-muted">
                  Permintaan muncul saat siswa memasukkan kode kelas.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {activeClass.requests.map((request) => (
                  <li
                    key={request.id}
                    className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar initials={request.initials} />
                      <div>
                        <div className="text-sm font-semibold text-ink">{request.name}</div>
                        <div className="text-[11px] text-muted">Mengajukan {request.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleRejectMember(request)}
                        className="btn-danger text-xs"
                      >
                        <X size={13} /> Tolak
                      </button>
                      <button
                        onClick={() => handleApproveMember(request)}
                        className="btn-primary text-xs"
                      >
                        <Check size={13} /> Setujui
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* MODAL: BUAT TUGAS */}
      <Modal
        open={asgModal}
        onClose={() => setAsgModal(false)}
        label="Buat tugas baru"
        dialogRef={asgModalRef}
      >
        <form onSubmit={handleCreateAssignment} className="mt-2 space-y-3.5">
          <h2 className="font-display text-lg font-bold text-ink">Buat Tugas</h2>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Judul</label>
            <input
              value={asgForm.title}
              onChange={(e) => setAsgForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: Latihan Integral"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Topik</label>
              <input
                value={asgForm.topic}
                onChange={(e) => setAsgForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="Integral"
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Poin</label>
              <input
                type="number"
                min={0}
                value={asgForm.points}
                onChange={(e) => setAsgForm((f) => ({ ...f, points: e.target.value }))}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Tenggat</label>
            <input
              value={asgForm.due}
              onChange={(e) => setAsgForm((f) => ({ ...f, due: e.target.value }))}
              placeholder="Jumat, 23.59"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Lampiran Materi</label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="btn-outline btn-sm cursor-pointer">
                <Upload size={13} />
                {asgFile ? "Ganti Berkas" : "Unggah Berkas"}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.mp4"
                  onChange={(e) => {
                    attachFile(e.target.files?.[0], setAsgFile);
                    e.target.value = "";
                  }}
                />
              </label>
              <span className="text-[11px] text-muted">atau</span>
              <input
                value={asgLink}
                onChange={(e) => setAsgLink(e.target.value)}
                placeholder="Tautan Google Drive (opsional)"
                className="min-w-[180px] flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>
            {asgFile && (
              <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-cream px-3 py-2 text-xs font-semibold text-ink">
                <Paperclip size={13} className="flex-shrink-0 text-brand-green" />
                <span className="truncate">{asgFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAsgFile(null)}
                  className="btn-icon h-6 w-6"
                  aria-label="Hapus lampiran"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Instruksi</label>
            <textarea
              value={asgForm.instructions}
              onChange={(e) => setAsgForm((f) => ({ ...f, instructions: e.target.value }))}
              rows={3}
              placeholder="Tulis instruksi pengerjaan..."
              className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setAsgModal(false)} className="btn-outline">
              Batal
            </button>
            <button type="submit" className="btn-primary">
              <Send size={14} /> Publikasikan
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DETAIL TUGAS (SISWA) */}
      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        label={detailTarget?.title ?? "Detail tugas"}
        dialogRef={detailModalRef}
      >
        {detailTarget && (
          <div className="mt-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                <FileText size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{detailTarget.title}</h2>
                <p className="text-xs text-muted">
                  {detailTarget.topic} · {detailTarget.points} poin
                </p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/85">
              {detailTarget.instructions}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <Clock size={12} aria-hidden="true" /> Tenggat: {detailTarget.due}
              </span>
              {detailTarget.attachment && (
                <a
                  href={detailTarget.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-green hover:underline"
                >
                  {detailTarget.attachment.type === "drive" ? (
                    <Link2 size={12} aria-hidden="true" />
                  ) : (
                    <Paperclip size={12} aria-hidden="true" />
                  )}
                  {detailTarget.attachment.name}
                </a>
              )}
            </div>

            {(() => {
              const mine = submissionOf(detailTarget, userName);
              const submitted = mine && mine.status !== "assigned";
              return (
                <div className="mt-5 border-t border-line pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-ink">Pengumpulan kamu</div>
                    {mine ? <StatusBadge status={mine.status} /> : null}
                  </div>

                  {mine?.status === "graded" && (
                    <div className="mt-3 rounded-lg bg-brand-green/5 px-3 py-2.5 text-xs">
                      <div className="font-display text-lg font-extrabold text-brand-green">
                        {mine.grade}
                        <span className="text-xs font-semibold text-muted">
                          /{detailTarget.points}
                        </span>
                      </div>
                      {mine.feedback && <p className="mt-1 text-muted">{mine.feedback}</p>}
                    </div>
                  )}

                  <label className="mt-3 mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Link2 size={13} className="text-brand-green" aria-hidden="true" />
                    Tautan Google Drive
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-xs focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                    <button
                      onClick={() => handleSubmitLink(detailTarget.id)}
                      className="btn-primary btn-sm flex-shrink-0"
                    >
                      <Upload size={13} /> {submitted ? "Perbarui" : "Kumpulkan"}
                    </button>
                  </div>

                  {submitted && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={mine?.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold text-brand-green hover:underline"
                      >
                        <Link2 size={12} aria-hidden="true" />
                        <span className="truncate">{mine?.link}</span>
                      </a>
                      {mine?.status !== "graded" && (
                        <button
                          onClick={() => handleCancelSubmit(detailTarget.id)}
                          className="text-[11px] font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
                        >
                          Batalkan pengumpulan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* MODAL: PERIKSA NILAI (GURU) */}
      <Modal
        open={!!gradeTarget}
        onClose={() => setGradeTarget(null)}
        label={gradeTarget ? `Periksa ${gradeTarget.title}` : "Periksa tugas"}
        dialogRef={gradeModalRef}
        wide
      >
        {gradeTarget && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-brand-green" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-ink">
                Periksa: {gradeTarget.title}
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              Tenggat {gradeTarget.due} · {gradeTarget.points} poin ·{" "}
              {gradeTarget.submissions.filter((s) => s.status !== "assigned").length}/
              {gradeTarget.submissions.length} terkumpul
            </p>

            <div className="mt-4 space-y-3">
              {gradeTarget.submissions.map((submission) => (
                <div key={submission.student} className="rounded-xl border border-line p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={submission.initials} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink">{submission.student}</div>
                        <div className="text-[11px] text-muted">
                          {submission.status === "assigned"
                            ? "Belum mengumpulkan"
                            : `Dikumpulkan ${submission.submittedAt ?? "-"}`}
                        </div>
                        {submission.link && (
                          <a
                            href={submission.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex max-w-[220px] items-center gap-1 text-[11px] font-semibold text-brand-green hover:underline"
                          >
                            <Link2 size={11} className="flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">Buka pekerjaan (Google Drive)</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={submission.status} />
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="number"
                      min={0}
                      max={gradeTarget.points}
                      placeholder="Nilai"
                      value={gradeDrafts[submission.student]?.grade ?? ""}
                      onChange={(e) =>
                        setGradeDrafts((prev) => ({
                          ...prev,
                          [submission.student]: {
                            grade: e.target.value,
                            feedback: prev[submission.student]?.feedback ?? "",
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30 sm:w-24"
                    />
                    <input
                      placeholder="Umpan balik singkat"
                      value={gradeDrafts[submission.student]?.feedback ?? ""}
                      onChange={(e) =>
                        setGradeDrafts((prev) => ({
                          ...prev,
                          [submission.student]: {
                            grade: prev[submission.student]?.grade ?? "",
                            feedback: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                    <button
                      onClick={() => saveGrade(submission.student)}
                      className="btn-primary btn-sm flex-shrink-0"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
