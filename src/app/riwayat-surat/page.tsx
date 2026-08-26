import { redirect } from "next/navigation";
import { ClaimSubmission, HistoryTable, LogoutButton } from "@/components/history-table";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const summaryMeta = [["Total diajukan", "blue"], ["Sedang diproses", "gold"], ["Disetujui / selesai", "green"], ["Ditolak", "red"]] as const;

export default async function HistoryPage() { 
  const user = await getCurrentUser(); 
  if (!user) redirect("/masuk?redirect=/riwayat-surat"); 
  const rows = await prisma.submission.findMany({ where: { applicantId: user.id }, include: { statusLogs: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" } }); 
  const submissions = rows.map(item => ({ ...item, createdAt: item.createdAt.toISOString(), statusLogs: item.statusLogs.map(log => ({ ...log, createdAt: log.createdAt.toISOString() })) })); 
  const counts = { 
    "Total diajukan": rows.length, 
    "Sedang diproses": rows.filter(item => item.status === "MENUNGGU_VERIFIKASI" || item.status === "DIPROSES").length, 
    "Disetujui / selesai": rows.filter(item => item.status === "DISETUJUI" || item.status === "SELESAI").length, 
    "Ditolak": rows.filter(item => item.status === "DITOLAK").length 
  };
  return (
    <main className="page-shell">
      <SiteHeader active="Riwayat Surat"/>
      <section className="dashboard">
        <div className="dashboard-title">
          <div>
            <span className="eyebrow">DASBOR PEMOHON</span>
            <h1>Halo, {user.name.split(" ")[0]}.</h1>
            <p>Pantau seluruh aktivitas surat Anda dalam satu tempat.</p>
          </div>
        </div>
        <div className="summary-grid summary-four">
          {summaryMeta.map(([label,color]) => (
            <article className={`summary ${color}`} key={label}>
              <span>{label}</span>
              <b>{counts[label]}</b>
              <small>Permohonan surat</small>
            </article>
          ))}
        </div>
        <ClaimSubmission/>
        <HistoryTable submissions={submissions}/>
      </section>
    </main>
  ); 
}
