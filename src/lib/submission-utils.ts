export const STATUS_LABELS: Record<string, string> = {
  MENUNGGU: "Menunggu",
  PERLU_REVISI: "Perlu Revisi",
  DITERUSKAN: "Diteruskan",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};
export function statusClass(status: string) { return status.toLowerCase().replaceAll("_", "-"); }
export function formatDate(value: Date | string) { 
  return new Intl.DateTimeFormat("id-ID", { 
    day: "numeric", month: "long", year: "numeric", 
    hour: "2-digit", minute: "2-digit" 
  }).format(new Date(value)).replace(".", ":") + " WITA"; 
}
