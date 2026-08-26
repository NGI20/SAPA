export const STATUS_LABELS: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi",
  DIPROSES: "Diproses",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
};
export function statusClass(status: string) { return status.toLowerCase().replaceAll("_", "-"); }
export function formatDate(value: Date | string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value)); }
