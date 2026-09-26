"use client";

import { ArrowLeft, ClipboardList, Link2, Megaphone, Paperclip, Send, Upload, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { classInitials, type ClassAssignment, type ClassAttachment, type ClassPost } from "@/lib/classroom";
import { Avatar } from "@/components/dashboard/parts/classroom/ClassroomUi";

type Props = {
  isTeacher: boolean;
  userName: string;
  posts: ClassPost[];
  assignments: ClassAssignment[];
  studentCount: number;
  postKind: "announcement" | "material";
  postText: string;
  postLink: string;
  postFile: ClassAttachment | null;
  commentDrafts: Record<string, string>;
  onPostKindChange: (kind: "announcement" | "material") => void;
  onPostTextChange: (value: string) => void;
  onPostLinkChange: (value: string) => void;
  onPostFileChange: (file: ClassAttachment | null) => void;
  onFilePicked: (file: File | undefined) => void;
  onSubmitPost: (event: React.FormEvent) => void;
  onCommentDraftChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string) => void;
  onGoToAssignments: () => void;
};

export default function ForumTab({
  isTeacher,
  userName,
  posts,
  assignments,
  studentCount,
  postKind,
  postText,
  postLink,
  postFile,
  commentDrafts,
  onPostKindChange,
  onPostTextChange,
  onPostLinkChange,
  onPostFileChange,
  onFilePicked,
  onSubmitPost,
  onCommentDraftChange,
  onSubmitComment,
  onGoToAssignments,
}: Props) {
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="space-y-4">
        {isTeacher && (
          <form onSubmit={onSubmitPost} className="card p-4">
            <div className="flex items-center gap-2">
              <Avatar initials={classInitials(userName)} />
              <select
                value={postKind}
                onChange={(e) => onPostKindChange(e.target.value as "announcement" | "material")}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-brand-green focus:outline-none"
              >
                <option value="announcement">Pengumuman</option>
                <option value="material">Materi</option>
              </select>
            </div>
            <textarea
              value={postText}
              onChange={(e) => onPostTextChange(e.target.value)}
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
                    onFilePicked(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <span className="text-[11px] text-muted">atau tempel tautan Drive:</span>
              <input
                value={postLink}
                onChange={(e) => onPostLinkChange(e.target.value)}
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
                  onClick={() => onPostFileChange(null)}
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

        {posts.length === 0 && (
          <div className="card p-8 text-center">
            <Megaphone size={28} className="mx-auto mb-3 text-line" aria-hidden="true" />
            <div className="text-sm font-semibold text-ink">Belum ada postingan</div>
            <div className="mt-1 text-xs text-muted">
              Pengumuman dan materi dari guru akan tampil di sini.
            </div>
          </div>
        )}

        {posts.map((post) => (
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
                  onChange={(e) => onCommentDraftChange(post.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSubmitComment(post.id);
                    }
                  }}
                  placeholder="Tulis komentar kelas..."
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
                <button
                  onClick={() => onSubmitComment(post.id)}
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
              <span className="font-semibold text-ink">{assignments.length}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted">
                <Megaphone size={13} /> Postingan
              </span>
              <span className="font-semibold text-ink">{posts.length}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted">
                <Users size={13} /> {isTeacher ? "Siswa" : "Teman"}
              </span>
              <span className="font-semibold text-ink">
                {isTeacher ? studentCount : Math.max(studentCount - 1, 0)}
              </span>
            </li>
          </ul>
        </div>
        <button onClick={onGoToAssignments} className="btn-ghost w-full justify-between">
          Lihat semua tugas <ArrowLeft size={14} className="rotate-180" />
        </button>
      </aside>
    </div>
  );
}
