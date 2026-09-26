export const userInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

export const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const relativeDay = (iso: string | null) => {
  if (!iso) return "Belum pernah";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 30) return `${days} hari lalu`;
  return formatDateTime(iso);
};

export const roleBadge = (roleKey: string) =>
  roleKey === "admin"
    ? "bg-brand-pine text-white"
    : roleKey === "teacher"
      ? "bg-brand-lime/25 text-brand-pine"
      : "bg-brand-green/10 text-brand-green";
