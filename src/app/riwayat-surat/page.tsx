import { redirect } from "next/navigation";
import { ClaimSubmission, HistoryTable } from "@/components/history-table";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const summaryMeta = [
  ["Total surat diajukan", "blue", <svg key="1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>],
  ["Sedang diproses", "gold", <svg key="2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>],
  ["Disetujui / selesai", "green", <svg key="3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>],
  ["Ditolak", "red", <svg key="4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>],
] as const;

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?redirect=/riwayat-surat");

  const rows = await prisma.submission.findMany({
    where: { applicantId: user.id },
    include: { statusLogs: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const submissions = rows.map((item) => ({
    ...item,
    catatanStaf: item.catatanStaf || null,
    createdAt: item.createdAt.toISOString(),
    statusLogs: item.statusLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  }));

  const counts = {
    "Total surat diajukan": rows.length,
    "Sedang diproses":
      rows.filter((i) => ["MENUNGGU", "PERLU_REVISI", "DITERUSKAN"].includes(i.status)).length,
    "Disetujui":
      rows.filter((i) => i.status === "DISETUJUI").length,
    Ditolak: rows.filter((i) => i.status === "DITOLAK").length,
  };

  return (
    <main className="page-shell">
      <SiteHeader active="Riwayat Surat" />
      <section className="dashboard">
        <div className="dashboard-title">
          <div>
            <span className="eyebrow">DASBOR PEMOHON</span>
            <h1>Halo, {user.name.split(" ")[0]}.</h1>
            <p>Pantau seluruh aktivitas surat Anda dalam satu tempat.</p>
          </div>
        </div>
        <div className="summary-grid">
          {summaryMeta.map(([label, color, icon]) => (
            <article className={`summary ${color}`} key={label}>
              <div className="summary-head">
                <span>{label === "Disetujui / selesai" ? "Disetujui" : label}</span>
                <span className="summary-icon">{icon}</span>
              </div>
              <b>{counts[label === "Disetujui / selesai" ? "Disetujui" : label as keyof typeof counts]}</b>
              <small>
                {label === "Total surat diajukan" && "Semua pengajuan"}
                {label === "Sedang diproses" && "Menunggu / Revisi"}
                {label === "Disetujui / selesai" && "Proses selesai"}
                {label === "Ditolak" && "Ditolak permanen"}
              </small>
            </article>
          ))}
        </div>
        <ClaimSubmission />
        <HistoryTable submissions={submissions} />
      </section>
    </main>
  );
}
